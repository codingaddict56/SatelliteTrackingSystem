const mongoose = require('mongoose')


const collision = new mongoose.Schema({
   satellite1:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Satellite'
   },  
   satellite2:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Satellite'
   },
   distance:{
    type:Number
   },
   selectedPriority:{
    type:String
   }
}, {
    timestamps: true
});


module.exports = mongoose.model('Collision', collision)