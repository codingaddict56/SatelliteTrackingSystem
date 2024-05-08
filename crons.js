const cron = require('node-schedule')
const Satellite = require('./models/Satellite');
const { collisionSatellites } = require('./satellite_services');

cron.scheduleJob("*/10 * * * * *",async function() {
    console.log("running")
    let satellites = await Satellite.find({moment_enabled:true})
    satellites.forEach(async(d,i) => {
        if(d.position.x < 1000 && d.position.x !== 0){
            d.position.x = 0
            d.moment_enabled = false
            d.save()
        }else{
            if(d.position.x < 500 ){
                d.position.x = 0
                d.moment_enabled = false
                d.save()
            }else{
                d.position.x -= 500
                d.save()
            }
           
        }
        // if(i === (satellites.length -1)){
        //     await collisionSatellites()  
        // }
    });

})