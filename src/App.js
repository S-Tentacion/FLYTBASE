import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import { FaLocationArrow, FaTimes } from "react-icons/fa";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useRef, useState, useEffect } from "react";

const center = { lat: 48.8584, lng: 2.2945 };

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });
  const [droneIcon, setDroneIcon] = useState(null);
  const [map, setMap] = useState(/** @type google.maps.Map */ (null));
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [positionIndex, setPositionIndex] = useState(0);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [time, setTime] = useState(350);
  const [timeError, setTimeError] = useState({
    show: false,
    message: "",
  });

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef();
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destiantionRef = useRef();

  useEffect(() => {
    let intervalId;
    if (directionsResponse) {
      intervalId = setInterval(() => {
        setPositionIndex((prevIndex) => {
          if (
            prevIndex ===
            directionsResponse.routes[0].overview_path.length - 1
          ) {
            clearInterval(intervalId);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, time);
    }
    return () => clearInterval(intervalId);
  }, [directionsResponse, time]);

  useEffect(() => {
    if (isLoaded) {
      setDroneIcon({
        url: "/camera-drone.png", // url of the drone image
        scaledSize: new window.google.maps.Size(50, 50), // size of the drone image
        origin: new window.google.maps.Point(0, 0), // position of the image origin
        anchor: new window.google.maps.Point(25, 25), // position of the image anchor
      });
    }
  }, [isLoaded]);

  async function calculateRoute() {
    if (originRef.current.value === "" || destiantionRef.current.value === "") {
      return;
    }
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destiantionRef.current.value,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    setTime(1000);
    originRef.current.value = "";
    destiantionRef.current.value = "";
  }

  const handleTimeChange = (e) => {
    if (e.target.value.match(/^[0-9]*$/)) {
      if (parseInt(e.target.value) < 1000) {
        setTimeError({
          show: true,
          message: "Please enter a number which is greater than 100",
        });
      } else {
        setTimeError({
          show: false,
          message: "",
        });
        setTime(parseInt(e.target.value));
      }
    } else {
      setTimeError({
        show: true,
        message: "Please enter a number",
      });
    }
  };

  if (!isLoaded) {
    return <SkeletonText />;
  }

  return (
    <Flex
      position="relative"
      flexDirection="column"
      alignItems="center"
      h="100vh"
      w="100vw"
    >
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
        {/* Google Map Box */}
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => setMap(map)}
        >
          {/* <Marker position={center} /> */}
          {directionsResponse && (
            <>
              <DirectionsRenderer directions={directionsResponse} />
              <Marker
                position={
                  directionsResponse.routes[0].overview_path[positionIndex]
                }
                icon={droneIcon}
              />
            </>
          )}
        </GoogleMap>
      </Box>
      <Box
        p={4}
        borderRadius="lg"
        m={4}
        bgColor="white"
        shadow="base"
        minW="container.md"
        zIndex="1"
      >
        <HStack spacing={2} justifyContent="space-between">
          <Box flexGrow={1}>
            <Autocomplete>
              <Input type="text" placeholder="Origin" ref={originRef} />
            </Autocomplete>
          </Box>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input
                type="text"
                placeholder="Destination"
                ref={destiantionRef}
              />
            </Autocomplete>
          </Box>
          {/* <Box width={200}>
            <Input
              type="text"
              placeholder="Time min 1000ms"
              onChange={handleTimeChange}
              value={time}
            />
            {timeError.show ? (
              <Text color="red"> {timeError.message}</Text>
            ) : null}
          </Box> */}
          <ButtonGroup>
            <Button colorScheme="pink" type="submit" onClick={calculateRoute}>
              Calculate Route
            </Button>
            <IconButton
              aria-label="center back"
              icon={<FaTimes />}
              onClick={clearRoute}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent="space-between">
          <Text>Distance: {distance} </Text>
          <Text>Duration: {duration} </Text>
          <IconButton
            aria-label="center back"
            icon={<FaLocationArrow />}
            isRound
            onClick={() => {
              map.panTo(center);
              map.setZoom(15);
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
}

export default App;
