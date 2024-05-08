const mongoose = require('mongoose')


const satelliteHealthSchema = new mongoose.Schema({
    info: {
        satname:{type: String},
        satid:{type: String},
        launch_date:{type: String},
        orbit_type:{type: String},
        status:{type: String},
    },
    sensor_info:[
        {
            satellite_id:{type:String},
            timestamps:{type:String},
            sensor_type:{type:String},
            value:{type:String}
        }],
    warn_info:[
        {
            satellite_id:{type:String},
            timestamps:{type:String},
            warn_stage:{type:String},
            value:{type:String}
        }],    
}, {
    timestamps: true
});


module.exports = mongoose.model('SatelliteHealth', satelliteHealthSchema)