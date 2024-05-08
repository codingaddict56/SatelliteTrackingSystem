const mongoose = require('mongoose')

const connection = async() => {
    try {
        await mongoose.connect('mongodb://localhost:27017/satellite_project1')
            console.log('Mongo Database Connected');		
    }
    catch(err) {
            console.log('error');		
    }
}


module.exports = connection
