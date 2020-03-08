const getInitials = (str: string) => str
.split(/\W/g)
.map(s => s.charAt(0) || '')
.join('')
.toUpperCase()

export default getInitials
