import React from 'react';
import { TouchableWithoutFeedback, GestureResponderEvent } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: any;
  scaleTo?: number; // O quanto ele encolhe (padrão 0.95)
}

const TouchableScale: React.FC<Props> = ({ 
  children, 
  onPress, 
  style, 
  scaleTo = 0.95 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPressIn = () => {
    scale.value = withSpring(scaleTo, { damping: 10, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <TouchableWithoutFeedback 
      onPressIn={onPressIn} 
      onPressOut={onPressOut} 
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default TouchableScale;