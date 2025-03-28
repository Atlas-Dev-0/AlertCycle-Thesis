import React, { useState, useEffect, useRef } from 'react';
import {Image as RNImage, View, Text, StyleSheet, Animated, ActivityIndicator} from 'react-native';
import Svg, { G, Circle, ClipPath, Defs, Path, Image, Line, LinearGradient, Stop} from 'react-native-svg';

const VehicleIcon = (VehiclesIcon) => {
  const icons = {
    bus: require('../assets/icons/bus.png'),
    car: require('../assets/icons/car.png'),
    cyclist: require('../assets/icons/cylist.png'),
    jeep: require('../assets/icons/jeep.png'),
    motor: require('../assets/icons/motor.png'),
    tricycle: require('../assets/icons/tricycle.png'),
    truck: require('../assets/icons/truck.png'),
 };
  return icons[VehiclesIcon.toLowerCase()] || require('../assets/icons/motor.png');
};

const getVehicleSize = (vehicleType) => {
  const sizes = {
    motor: { width: 7, height: 7},
    bus: { width: 15, height: 15},
    car: { width: 10, height: 10},
    cyclist: { width: 8, height: 8 },
    jeep: { width: 15, height: 15 },
    tricycle: { width: 8, height: 8},
    truck: { width: 20, height: 20},
  };
  return sizes[vehicleType.toLowerCase()] || { width: 10, height: 10 }; // Default size if vehicle type isn't found
};


const dedupeVehicles = (vehicles, threshold = 2) => {
  const deduped = [];
  vehicles.forEach(vehicle => {
    // Check if a vehicle with the same object_class already exists in deduped list
    // and if their positions are within the threshold.
    const index = deduped.findIndex(v =>
      v.object_class === vehicle.object_class &&
      Math.abs(v.x - vehicle.x) < threshold &&
      Math.abs(v.y - vehicle.y) < threshold
    );
    if (index === -1) {
      // No duplicate found, add it
      deduped.push(vehicle);
    } else {
      // If a duplicate exists, choose the one closer to (0,0)
      const existing = deduped[index];
      const existingDist = Math.sqrt(existing.x ** 2 + existing.y ** 2);
      const currentDist = Math.sqrt(vehicle.x ** 2 + vehicle.y ** 2);
      if (currentDist < existingDist) {
        deduped[index] = vehicle;
      }
    }
  });
  return deduped;
};

const Radar = ({ coordinates }) => {
  const heightOfRadar = 30;
  const userIcon = require("../assets/icons/user.png"); // ✅ Import PNG

  // Normalize function to fit coordinates in radar view (assuming width is 600px in Python)
  const normalizePosition = (value) => (value / 600) * 28; // Scale to SVG range

  return (
<View style={styles.radarContainer}>
  {/* Radar Background Layer */}
  <Svg
    style={StyleSheet.absoluteFill}
    viewBox="-10 0 20 20"
    preserveAspectRatio="xMidYMid meet"
  >
    <Defs>
      <LinearGradient id="radarGradient" x1="0" y1="0" x2="0" y2={heightOfRadar} gradientUnits="userSpaceOnUse">
        <Stop offset="20%" stopColor="red" stopOpacity="0.3" />
        <Stop offset="40%" stopColor="yellow" stopOpacity="0.3" />
        <Stop offset="70%" stopColor="green" stopOpacity="0.3" />
      </LinearGradient>
      <LinearGradient id="radarGradientOutline" x1="0" y1="0" x2="0" y2={heightOfRadar} gradientUnits="userSpaceOnUse">
        <Stop offset="0%" stopColor="red" />
        <Stop offset="100%" stopColor="green" />
      </LinearGradient>
      <ClipPath id="radarClip">
        <Path d={`M 0 0 L -10 5 L -10 ${heightOfRadar} H 10 V 5 Z`} />
      </ClipPath>
    </Defs>

    <Path 
      id="mainradar" 
      d={`M 0 0 L -10 5 L -10 ${heightOfRadar} H 10 V 5 Z`} 
      fill="url(#radarGradient)" 
      strokeWidth="0.2" 
    />
    
    <G clipPath="url(#radarClip)">
      {[3, 6, 9, 12, 15, 18, 21, 23, 26, 28].map((radius, index) => (
        <Circle key={index} cx="0" cy="0" r={radius}   
          stroke="url(#radarGradientOutline)"
          strokeWidth="0.1" 
          fill="none" 
        />
      ))}
      {[...Array(20)].map((_, i) => {
        const angle = (i * 10 * Math.PI) / 180;
        return (
          <Line
            key={i}
            x1="0"
            y1="0"
            x2={Math.cos(angle) * 28}
            y2={Math.sin(angle) * 28}
            stroke="url(#radarGradientOutline)"
            strokeWidth="0.1"
          />
        );
      })}
    </G>

    <Image
      href={userIcon}
      x="-4"  
      y="-4"
      width="8" 
      height="8"
      preserveAspectRatio="xMidYMid slice"
    />
  </Svg>

  {/* Vehicle Icons Layer */}
  <Svg
    style={StyleSheet.absoluteFill}
    viewBox="-10 0 20 20"
    preserveAspectRatio="xMidYMid meet"
  >
    {/* Define the same clipPath here if needed */}
    <Defs>
      <ClipPath id="vehicleClip">
        <Path d={`M 0 0 L -10 5 L -10 ${heightOfRadar} H 10 V 5 Z`} />
      </ClipPath>
    </Defs>

    <G clipPath="url(#vehicleClip)" style={styles.renderedIcon}>
      {coordinates.map((vehicle, index) => {
        const vehicleSize = getVehicleSize(vehicle.object_class);
        return (
          <Image
            style={styles.renderedIcon}
            key={index}
            href={VehicleIcon(vehicle.object_class)}
            x={normalizePosition(vehicle.x) - vehicleSize.width / 2}
            y={normalizePosition(vehicle.y + 100)} // Revisit this offset if needed
            width={vehicleSize.width}
            height={vehicleSize.height}
          />
        );
      })}
    </G>
  </Svg>
</View>
  );
};
// =============== DEVICE IP ADDRESS ===============//
const AC_IP = 'http://10.0.0.34:3000/api/data';     //
// =================================================//


// ===== FETCH DATA FROM SERVER ==========
//Data Format:
//--------------------------------------------
// detected_objects.append({
//     "object_class": object_class,
//     "x": center_x,
//     "y": center_y,
//     "mDA": average_depth,
//     "hazard_level": hazard_level, 
//     "realWorldDistance": realMetric,
// })
//--------------------------------------------

const fetchDataFromServer = async ()  => {
    try {
      const response = await fetch(AC_IP);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json(); 
      return data;
    } catch (err) {
        throw err;
    }
};
// =======================================

export default function AlertCycle() {
  const [coordinates, setCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setData] = useState([]);
  const [overallRisk, setOverallRisk] = useState("");
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [nearestVehicle, setNearestVehicle] = useState(null);


  const road_background = require("../assets/ui-components/road-background.jpg");


//--------------------------------------------
// detected_objects.append({
//     "object_class": object_class,
//     "x": center_x,
//     "y": center_y,
//     "mDA": average_depth,
//     "hazard_level": hazard_level, 
//     "realWorldDistance": realMetric,
// })
//--------------------------------------------


// Map average depth to the appropriate y coordinate on the radar (y range: 0 to 550)
const mapMADToY = (mAD) => {
  if (mAD >= 150) {
    // High risk: map mAD [150, maxHighMAD] to y [0, 129]
    const maxHighMAD = 200; // adjust based on expected range
    const clampedMAD = Math.min(mAD, maxHighMAD);
    return ((clampedMAD - 150) / (maxHighMAD - 150)) * 129;
  } else if (mAD >= 140 && mAD < 150) {
    // Hazardous: map mAD [140, 150] to y [130, 250]
    return ((mAD - 140) / 10) * (250 - 130) + 130;
  } else if (mAD >= 130 && mAD < 140) {
    // Safe: map mAD [130, 140] to y [250, 350] (now clamped so icons don't get too far)
    return ((mAD - 130) / 10) * (350 - 250) + 250;
  } else {
    // For mAD values below 130, default to the farthest safe position within the new limit.
    return 350;
  }
};

useEffect(() => {
  const getData = async () => {
    try {
      setLoading(true);
      const result = await fetchDataFromServer();

      // Filter out default/invalid data (data with object_class of 'none')
      const validData = result.filter(item => item.object_class !== 'none');

      // If there's no valid data, clear coordinates and return early
      if (validData.length === 0) {
        setCoordinates([]);
        setData([]);
        return;
      }

      // Transform valid data to coordinate format
      const formattedCoordinates = validData.map(item => ({
        object_class: item.object_class,
        x: 0, // Adjust x mapping if needed
        // Use the new mapMADToY function to determine y based on mAD
        y: mapMADToY(item.mDA),
        mDA: item.mDA,
        hazard_level: item.hazard_level,
      }));
      
      const dedupedCoordinates = dedupeVehicles(formattedCoordinates, 5);
      
      setData(validData);
      setCoordinates(dedupedCoordinates);
      setError(null);
      console.log(`data: ${JSON.stringify(formattedCoordinates)}`);
    } catch (err) {
      setLoading(true);
      setError('Error fetching data');
      console.log(`error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  getData();
  const interval = setInterval(getData, 500);
  return () => clearInterval(interval);
}, []);

    // Checking risk level based on coordinates
    useEffect(() => {
      const checkRiskAndNearestVehicle = () => {
        // Check risk level
        if (coordinates.some(item => item.hazard_level === 'high')) {
          setOverallRisk('high');
        } else if (coordinates.some(item => item.hazard_level === 'hazardous')) {
          setOverallRisk('hazardous');
        } else {
          setOverallRisk('safe');
        }

        // Find the nearest vehicle
        const nearest = findNearestVehicle(coordinates);
        setNearestVehicle(nearest);
      };

      checkRiskAndNearestVehicle();
    }, [coordinates]);



    // Function to calculate the distance between two points
    const calculateDistance = (x1, y1, x2, y2) => {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    // Function to find the nearest vehicle
    const findNearestVehicle = (coordinates, userX = 0, userY = 0) => {
      if (coordinates.length === 0) return null;

      let nearestVehicle = coordinates[0];
      let minDistance = calculateDistance(userX, userY, nearestVehicle.x, nearestVehicle.y);

      coordinates.forEach((vehicle) => {
        const distance = calculateDistance(userX, userY, vehicle.x, vehicle.y);
        if (distance < minDistance) {
          minDistance = distance;
          nearestVehicle = vehicle;
        }
      });

      return nearestVehicle;
    };


  // Animation for risk indicator
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [overallRisk]);

  useEffect(() => {
  console.log(`Coordinates to plot:`, coordinates);
}, [coordinates]);
  return (
    <View style={styles.container}>

      <RNImage source={road_background} style={styles.road_background} />
 
      {/* ===== Coordinate View Port ====== */} 
      <View style={styles.CoordinatesViewPort}>
        {result.length > 0 ? (
            result.map((result, index) => (
              <Text key={index} style={styles.coordinateText}>
                Object: {result.object_class}, X: {result.x}, Y: {result.mDA}
              </Text>
            ))
          ) : (
              <Text> No coordinates available </Text>
        )}
      </View>
      {/* ================================ */} 
      
      {/* ===== Animated Risk Indicator ====== */} 
      <View style={styles.RiskViewPort}>
 <Animated.View
    style={[
      styles.riskIndicator,
      {
        transform: [{ scale: scaleAnim }],
        backgroundColor:
          overallRisk === 'high'
            ? 'rgba(255, 0, 0, 0.7)' // High Risk: Red
            : overallRisk === 'hazardous'
            ? 'rgba(255, 255, 0, 0.7)' // Hazardous: Yellow
            : 'rgba(0, 255, 0, 0.3)', // Safe: Green
      },
    ]}
  >
    <Text style={styles.riskText}>
      {overallRisk === 'high'
        ? 'HIGH RISK DISTANCE!!'
        : overallRisk === 'hazardous'
        ? 'HAZARDOUS DISTANCE'
        : 'SAFE DISTANCE'}
    </Text>
    
    {nearestVehicle && (
      <Text style={styles.riskText}>
        Vehicle: {nearestVehicle.object_class.toUpperCase()}
      </Text>
    )}
        </Animated.View>
      </View>
      {/* =================================== */} 

      {/* ======= Radar Component====== */} 
      <Radar coordinates={coordinates}/>
      {/* ====================== */} 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: "100%",
    height: "100%",
    position: 'relative',  
  },
  road_background: {
    position: 'absolute', 
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
    zIndex: -1,
  },
  CoordinatesViewPort: {
    padding: 10,
  },
  coordinateText: {
    fontSize: 14,
    color: 'black',
    marginBottom: 5,
  },
  RiskViewPort: {
    position: 'absolute', 
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    width: "100%",
    height: "10%",
    top: 30,
    justifyContent: 'center',
  },
  radarContainer: {
    width: "100%",
    height: "100%",
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskIndicator: {
    top:0,
    padding: 10,
    width: '100%',
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  riskText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  userIcon: {
    color: 'white',
    width: 100,
    height: 100,
  },
  renderedIcon: {
    position: 'absolute', 
    zIndex: 2,
  },
});

