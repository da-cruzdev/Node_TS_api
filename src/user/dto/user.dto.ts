export interface CreateUserDTO {
  name: string
  email: string
  password: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface updatedUserData {
  name?: string
  email?: string
  oldPassword?: string
  newPassword?: string
}
