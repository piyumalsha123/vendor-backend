import { UserModel } from "../models/userModel"

export const saveUser = async (user: any) => {
  const { email, name, password } = user
  // user.email
  const exUser = await UserModel.findOne({ email })
//   if (exUser) {
//     return res.status(400).json({ message: "User already exists..!" })
//   }

//   // bcrypt
//   const salt = bcrypt.genSaltSync(10)
//   const hashedPassword = bcrypt.hashSync(password, salt)

//   const newUser = new UserModel({
//     name,
//     email,
//     password: hashedPassword,
//     approved: true
//   })

//   const savedUser = await newUser.save()
}
