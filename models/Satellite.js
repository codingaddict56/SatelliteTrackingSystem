const mongoose = require('mongoose')


const satellite = new mongoose.Schema({
   name:{
    type:String
   },  
   type:{
    type:String,
    default:"satellite",
    enum:['satellite','object']
   },
   norad_id:{
    type:String
   },
   orbit_type:{
    type:String
   },
   international_designator:{
    type:String
   }, 
   launch_date:{
    type:String
   },
   orbital_elements:{
    semi_major_axis_km: {type:Number},
    eccentricity: {type:Number},
    inclination_deg: {type:Number},
    argument_of_periapsis_deg: {type:Number},
    longitude_of_ascending_node_deg: {type:Number},
    mean_anomaly_deg: {type:Number},
   },
   position:{
        x:{type:Number},
        y:{type:Number},
        z:{type:Number},
        satlatitude:{type: String},
        satlongitude:{type: String},
        sataltitude:{type: String},
        azimuth:{type: String},
        elevation:{type: String},
        ra:{type: String},
        dec:{type: String},
        timestamp:{type: String},
        eclipsed:{type: String}
    },
   moment_enabled:{
       type:Boolean,
       default:false
   },   
   relational_satellite:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Satellite'
    }
   ]
}, {
    timestamps: true
});


module.exports = mongoose.model('Satellite', satellite)