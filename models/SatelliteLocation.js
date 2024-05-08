const mongoose = require('mongoose')


const satelliteLocationSchema = new mongoose.Schema({
    info: {
        satname:{type: String},
        satid:{type: String},
        transactionscount:{type: String},
    },
    positions:{
        satlatitude:{type: String},
        satlongitude:{type: String},
        sataltitude:{type: String},
        azimuth:{type: String},
        elevation:{type: String},
        ra:{type: String},
        dec:{type: String},
        timestamp:{type: String},
        eclipsed:{type: String},
    },
    user_location:{
        ip:{type: String},
        hostname:{type: String},
        latitude:{type: String},
        longitude:{type: String},
        altitude:{type: String},
        city:{type: String},
        postal:{type: String},
        region:{type: String},
        country:{type: String},
        ord:{type: String},
        timezone:{type:String}
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('SatelliteLocation', satelliteLocationSchema)