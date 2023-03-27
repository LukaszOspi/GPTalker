import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  LogBox,
} from 'react-native';
import Voice from 'react-native-voice';
import Tts from 'react-native-tts';
import LanguageSelector from './components/LanguageSelector';
import {openAIAPIKey as GPT_API_KEY} from './apiKeys';
import { googleAPIKey as GOOGLE_API_KEY } from './apiKeys';
import axios from 'axios';
import RNFS from 'react-native-fs';
import SoundPlayer from 'react-native-sound-player';

LogBox.ignoreLogs(['Possible Unhandled Promise Rejection']);



const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-UK');
  const [stopTTSButtonText, setStopTTSButtonText] = useState('Stop Audio Output');
  const [responseText, setResponseText] = useState('');
  const [ttsInitialized, setTtsInitialized] = useState(false);
  console.disableYellowBox = true;


  useEffect(() => {
    const initTts = async () => {
      try {
        await Tts.getInitStatus();
        setTtsInitialized(true);
      } catch (err) {
        console.warn('TTS initialization failed:', err);
      }
    };
    initTts();
  }, []);
  
  
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
  
  useEffect(() => {
    if (transcription) {
      onSendToGPT();
    }
  }, [transcription]);
  

  const onSpeechError = error => {
    console.error('Speech error:', error);
    setIsRecording(false);
  };

  const onSpeechStart = () => {
    setIsRecording(true);
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  const onSpeechResults = async event => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      console.log(`Transcription: ${text}`);
      setTranscription(text);
    }
  };
  

  const startRecording = async () => {
    try {
      setTranscription(''); // Clear transcription when starting a new recording
      setResponseText(''); // Clear ChatGPT response when starting a new recording
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

  const changeLanguage = async (lang) => {
    if (!ttsInitialized) {
      console.warn('TTS is not initialized yet');
      return;
    }
    console.log('Selected language:', lang);
    setSelectedLanguage(lang);
    Voice.destroy().then(Voice.removeAllListeners);
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
  
    if (lang === 'pl-PL') {
      try {
        await Tts.setDefaultEngine('com.google.android.tts');
        await Tts.setDefaultLanguage('pl-PL');
      } catch (err) {
        console.error('Error setting default engine and language for Polish:', err);
      }
    } else {
      try {
        await Tts.setDefaultLanguage(lang);
      } catch (err) {
        console.error('Error setting default language:', err);
      }
    }
  };
  
  
  
  
  const sendTextToChatGPT = async text => {
    try {
      const openaiURL = 'https://api.openai.com/v1/engines/text-davinci-002/completions';
      const prompt = `User: ${text}\nAI:`;
      const response = await axios.post(
        openaiURL,
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
            'Authorization': `Bearer ${GPT_API_KEY}`,
          },
        }
      );
      const chatGPTResponse = response.data.choices[0].text.trim();
      console.log('ChatGPT Response:', chatGPTResponse);
      return chatGPTResponse;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Error: Invalid API key or unauthorized access.');
      } else {
        console.error('Error:', error);
      }
    }
  };
  const speakText = async (text, language) => {
    console.log('Speaking text:', text, 'Language:', language); // Add this line

    if (language === 'pl-PL') {
      console.log('Using Google TTS for Polish'); // 
      const googleTtsResponse = await googleTtsSpeak(text, language);
      const audioPath = `${RNFS.DocumentDirectoryPath}/tts.wav`;
      await RNFS.writeFile(audioPath, googleTtsResponse, 'base64');
      SoundPlayer.playSoundFile('tts', 'wav');
    } else {
      console.log('Using react-native-tts for other languages');
      Tts.setDefaultLanguage(language);
      Tts.speak(text);
    }
  };
  
  
  
  
  
  const onSendToGPT = async (language = selectedLanguage) => {
    if (transcription) {
      const chatGPTResponse = await sendTextToChatGPT(transcription);
      setResponseText(chatGPTResponse);
      speakText(chatGPTResponse, language);
    } else {
      console.log("Transcription is empty or null.");
    }
  };
  
  
  
  
  
  
  
  const onStopTTS = () => {
    Tts.stop();
    setStopTTSButtonText('Audio Output Stopped');
  
    setTimeout(() => {
      setStopTTSButtonText('Stop Audio Output'); // Reset button text
    }, 1000);
  };
  
  
  const googleTtsSpeak = async (text, language) => {
    const url = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${GOOGLE_API_KEY}`;
    const requestBody = {
      input: {
        text: text,
      },
      voice: {
        languageCode: language,
        name: language === 'pl-PL' ? 'pl-PL-Wavenet-D' : 'en-US-Wavenet-A', // Specify the voice name
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
      },
    };
  
    try {
      const response = await axios.post(url, requestBody);
      const base64Audio = response.data.audioContent;
      const audioPath = `${RNFS.DocumentDirectoryPath}/tts.wav`;
      await RNFS.writeFile(audioPath, base64Audio, 'base64');
      SoundPlayer.playSoundFile('tts', 'wav');
    } catch (error) {
      console.error('Google TTS error:', error);
    }
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
        </View>
        <View style={styles.chatGPTResponseContainer}>
        <Text>ChatGPT Response: {responseText}</Text>
      </View>
      <TouchableOpacity
        onPress={onStopTTS}
        style={styles.stopRecordingButton}>
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
  chatGPTResponseContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  stopRecordingButton: {
    backgroundColor: 'red',
          padding: 20,
          borderRadius: 10,
          marginTop: 20,
  },
  sentPromptContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  languageDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default App;
