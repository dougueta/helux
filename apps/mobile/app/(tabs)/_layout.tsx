import React from 'react'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontFamilies } from '@/constants/theme'
import Icon from '@/components/shared/Icon'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface1,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          paddingBottom: insets.bottom,
          height: 56 + insets.bottom,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontFamily: fontFamilies.ui,
          fontSize: 11,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, size }) => <Icon name="dumbbell" size={size} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="dna"
        options={{
          title: 'DNA',
          tabBarIcon: ({ color, size }) => <Icon name="dna" size={size} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, size }) => <Icon name="chart" size={size} stroke={color} />,
        }}
      />
    </Tabs>
  )
}
