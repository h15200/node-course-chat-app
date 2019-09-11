const socket = io()

//Elements - $var is for dom elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })   // parses the room option which is in query string. location.search is available on browsers
                                                                        // second option object removes the '?' 
const autoscroll = () => {
  // get the element (message or location that was added most recently)
  const $newMessage = $messages.lastElementChild

  // get height of new message
  const newMessageStyles = getComputedStyle($newMessage) // getComputedStyle tracks the css attached to element
  const newMessageMargin = parseInt(newMessageStyles.marginBottom) 
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  //visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // how far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, { 
       username: message.username,
       message: message.text, 
       createdAt: moment(message.createdAt).format('h:mm a') 
  }) //using moment library
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})

socket.on('locationMessage', (message) => {
  console.log(message)
  const html = Mustache.render(locationTemplate, { 
          username: message.username,
          url: message.url,
          createdAt: moment(message.createdAt).format('h:mm a') })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
          room,
          users
  })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault()
  // disable submit button 
  $messageFormButton.setAttribute('disabled', 'disabled')
  const message = $messageFormInput.value //gets the input element inside the form event. message is the name of the input

  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled') // enable button
    $messageFormInput.value = ''     // clear input
    $messageFormInput.focus()    // focus back to input 
    if (error){ //if there was an arg in the callback, then it never went through
      return console.log(error)
    }
    if (!error){
      console.log('the message was delivered!') // this the callback on the receiving end
  }}
)})


$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation){
    return alert('geolocation not supported by your browser')
  }

  $locationButton.setAttribute('disabled', 'disabled') // disable lcoation button

  navigator.geolocation.getCurrentPosition((position)=> {
    socket.emit('sendLocation', {latitude: position.coords.latitude, 
                              longitude: position.coords.longitude
  }, () => {
          $locationButton.removeAttribute('disabled')
          console.log('location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})

