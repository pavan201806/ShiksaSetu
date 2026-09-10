import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ClassSelectionScreen } from '../screens/ClassSelectionScreen';
import { SubjectSelectionScreen } from '../screens/SubjectSelectionScreen';
import { ChapterListScreen } from '../screens/ChapterListScreen';
import { LessonContentScreen } from '../screens/LessonContentScreen';
import { VoiceAssistantScreen } from '../screens/VoiceAssistantScreen';
import { TranslationResultScreen } from '../screens/TranslationResultScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PhrasebookScreen } from '../screens/PhrasebookScreen';
import { GenerateWorksheetScreen } from '../screens/GenerateWorksheetScreen';
import { Lesson } from '../services/syllabusService';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ClassSelection: undefined;
  SubjectSelection: { classId: number; className: string };
  ChapterList: { classId: number; className: string; subjectId: string; subjectName: string };
  LessonContent: {
    classId?: number;
    className: string;
    subjectName: string;
    chapterTitle: string;
    lesson: Lesson;
  };
  GenerateWorksheet: {
    classId?: number;
    className?: string;
    subjectId?: string;
    subjectName?: string;
    defaultTopic?: string;
    sourceContent?: string;
  };
  VoiceAssistant: undefined;
  TranslationResult: { hindiTranscript: string };
  Settings: undefined;
  Phrasebook: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ClassSelection" component={ClassSelectionScreen} />
        <Stack.Screen name="SubjectSelection" component={SubjectSelectionScreen} />
        <Stack.Screen name="ChapterList" component={ChapterListScreen} />
        <Stack.Screen name="LessonContent" component={LessonContentScreen} />
        <Stack.Screen name="GenerateWorksheet" component={GenerateWorksheetScreen} />
        <Stack.Screen name="VoiceAssistant" component={VoiceAssistantScreen} />
        <Stack.Screen name="TranslationResult" component={TranslationResultScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Phrasebook" component={PhrasebookScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
