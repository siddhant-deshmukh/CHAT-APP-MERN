export interface IChatListCardData {
  _id: string,
  avatarUrl: string | null,
  name: string | null,
  last_msg: string,
  updatedAt: number,
  // user: IUser
}

export interface IUser {
  _id: string,
  avatarUrl: string | null,
  name: string,
  user_name: string,
  bio?: string,
  lastSeen: number,
}

export interface IMsg {
  _id: string,
  msgAuthor: IUser | null,
  text: string,
  type: null | 'text' | 'img' | 'video' | 'sticker',
  createdAt: Date,
}