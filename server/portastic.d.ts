declare module 'portastic' {
  export default {
    find: (options: {min: number, max: number}):Promise<number[]>
  }
}
