export type Column = {
  id: string
  title: string
  color: string
}

export type Task = {
  id: string
  title: string
  columnId: string
  order: number
  categoryId?: string
  assigneeId?: string
}

export type Category = {
  id: string
  name: string
  color: string
}

export type User = {
  id: string
  name: string
  avatarUrl?: string
}
