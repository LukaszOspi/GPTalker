import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import Voice from 'react-native-voice';
import axios from 'axios';
import Tts from 'react-native-tts';
import LanguageSelector from './components/LanguageSelector';
import {googleAPIKey, openAIAPIKey} from './apiKeys';
const OpenAI = require('openai');


const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [responseText, setResponseText] = useState('');
  const [stopTTSButtonText, setStopTTSButtonText] = useState('Stop Audio Output');
  const [selectedLanguage, setSelectedLanguage] = useState('en-UK');

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Tts.setDefaultLanguage(selectedLanguage);
  

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [selectedLanguage]);

  const onSpeechError = error => {
    console.error('Speech error:', error);
    Tts.speak(`Speech recognition error: ${error.error.message}`);
    setIsRecording(false);
  };

  const onSpeechStart = () => {
    setIsRecording(true);
    setResponseText('');
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  const onSpeechResults = async event => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      console.log(`Transcription: ${text}`);
      setTranscription(text);
      const chatGPTResponse = await sendTextToChatGPT(text);
      setResponseText(chatGPTResponse);
      Tts.speak(chatGPTResponse);
    }
  };

  const startRecording = async () => {
    try {
      await Voice.start(selectedLanguage);
    } catch (error) {
      console.error('Error starting Voice:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping Voice:', error);
    }
  };
  const sendTextToChatGPT = async text => {
    try {
      const prompt = `User: ${text}\nAI:`;
      const openaiUrl = 'https://api.openai.com/v1/engines/text-davinci-002/completions';
      const response = await axios.post(
        openaiUrl,
        {
          prompt: prompt,
          max_tokens: 500,
          n: 1,
          stop: null,
          temperature: 0.5,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAIAPIKey}`,
          },
        },
      );
  
      const chatGPTResponse = response.data.choices[0].text.trim();
      console.log('ChatGPT Response:', chatGPTResponse);
      return chatGPTResponse;
    } catch (error) {
      console.error('Error:', error);
    }
  };
  

  const onStopTTS = () => {
    Tts.stop();
  };

  const changeLanguage = lang => {
    setSelectedLanguage(lang);
    Voice.destroy().then(Voice.removeAllListeners);
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Tts.setDefaultLanguage(lang);
  };


  return (
    <SafeAreaView style={styles.container}>
    <LanguageSelector
      selectedLanguage={selectedLanguage}
      onSelectLanguage={changeLanguage}
    />
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <TouchableOpacity
          onPressIn={startRecording}
          onPressOut={stopRecording}
          style={styles.recordButton}>
          <Text style={styles.buttonText}>Hold to Record</Text>
        </TouchableOpacity>
        <View style={styles.responseContainer}>
          <Text>Transcription: {transcription}</Text>
          <Text>ChatGPT Response: {responseText}</Text>
        </View>
        <TouchableOpacity
          onPress={onStopTTS}
          style={{
            backgroundColor: 'red',
            padding: 20,
            borderRadius: 10,
            marginTop: 20,
          }}>
          <Text style={{color: 'white'}}>{stopTTSButtonText}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: statusBarHeight,
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  recordButton: {
    backgroundColor: 'blue',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
  },
  responseContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
});

export default App;


