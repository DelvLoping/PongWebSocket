var udp = require('dgram');

//var buffer = require('buffer');

// creating a client socket
var client = udp.createSocket('udp4');

client.bind(15226)

//buffer msg
var data = Buffer.from('siddheshrane');

client.on('message',function(msg,info){
  console.log('Data received from server : ' + msg.toString());
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
});

//sending msg

// client.send(data,2222,'192.168.34.127',function(error){
//   if(error){
//     client.close();
//   }else{
//     console.log('Data sent !!!');
//   }
// });

var data1 = Buffer.from('hello');
var data2 = Buffer.from('world');

//sending multiple msg
setInterval(function(){
    client.send([data1,data2],15226,'192.168.34.126',function(error){
    if(error){
        console.log(error)
        client.close();
    }else{
        console.log('Data sent !!!');
    }
    });
}, 1000);