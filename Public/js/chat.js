const socket = io()


const form = document.querySelector('#messageForm');
const inputMsg = document.querySelector('#msg');
const submit = document.querySelector('#submit');
const locationButton = document.querySelector("#sendLocation");
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
const messages = document.querySelector("#messages");
const chat__sidebar = document.querySelector(".chat__sidebar");

const {username,room } = Qs.parse(location.search,{ ignoreQueryPrefix : true})

const autoScroll = ()=>{

    const newMessage = messages.lastElementChild
    
    const newMessageStyle = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    const visibleHeight = messages.offsetHeight
    const containerHegiht = messages.scrollHeight
    const scrollOffset =    messages.scrollTop + visibleHeight
    
    if(containerHegiht - newMessageHeight <= scrollOffset)
    {
        messages.scrollTop = messages.scrollHeight
    }

} 

socket.on('locationMsg',(location)=>{

    const html = Mustache.render(locationTemplate,{
        username: location.username,
        locLink : location.url,
        createdAt : moment(location.createdAt).format('h:mm a')
    })

    messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
    console.log(location);
})

socket.on("message",(msg)=>{

    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message : msg.text,
        createdAt : moment(msg.createdAt).format('h:mm a')
    })

    messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
    console.log(msg);
})


form.addEventListener('submit',(e)=>{
    e.preventDefault(); 

    submit.setAttribute('disabled','disabled')


    console.log('clicked')
    socket.emit('clientMsg',inputMsg.value,(error)=>{
        
        submit.removeAttribute('disabled')
        inputMsg.value = ''
        inputMsg.focus()

        if(error){
            return console.log('Wrong Message')
        }
        
        console.log('Message delivered')
    })
})

document.querySelector("#sendLocation").addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('You don\'t have location access')
    }
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position)
        locationButton.setAttribute('disabled','disabled')
        socket.emit('sendLocation',{latitude:position.coords.latitude,longitude:position.coords.longitude},(error)=>{
            locationButton.removeAttribute('disabled');
            console.log("Message Send")
        })
    })
})


socket.on("countupdated",(count)=>{
    console.log("Count is updated to "+count)
})

socket.emit("join", {username,room},(error)=>{
    if(error)
    {
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData',({room,users})=>{

    const html = Mustache.render(sidebarTemplate,{
        users,
        room
    })

    chat__sidebar.innerHTML = ('beforeend',html)
})