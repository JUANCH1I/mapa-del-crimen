import { View, Text, TextInput } from "react-native"

const Register = () => {
  return (
    <View>
      <Text>Register</Text>
      <TextInput placeholder="Email" />
      <TextInput placeholder="Password" />
      <TextInput placeholder="Confirm Password" />
    </View>
  )
}

export default Register