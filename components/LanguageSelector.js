import React from 'react';
import {Picker} from '@react-native-picker/picker';

const LanguageSelector = ({selectedLanguage, onSelectLanguage}) => {
  return (
    <Picker
      selectedValue={selectedLanguage}
      onValueChange={itemValue => onSelectLanguage(itemValue)}
      style={{width: 150, height: 50}}>
      <Picker.Item label="ENG" value="en_GB" />
      <Picker.Item label="GER" value="de_DE" />
      <Picker.Item label="POL" value="pl_PL" />
    </Picker>
  );
};

export default LanguageSelector;
