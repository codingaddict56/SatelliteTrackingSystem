const Satellite = require('./models/Satellite')
const Collision = require('./models/Collision')
// const neo4j = require('neo4j-driver');
// require('dotenv').config();

// const uri = process.env.NEO4J_URI;
// const user = process.env.NEO4J_USER;
// const password = process.env.NEO4J_PASSWORD;



// const driver = neo4j.driver(uri, neo4j.auth.basic(user,password));



async function addSatellite(data) {
    return await Satellite.create(data)
//   const session = driver.session();

// //   console.log("session",session)
//   try {
//     const orbitalElementsProperties = {
//         semiMajorAxis: orbitalElements.semiMajorAxis,
//         eccentricity: orbitalElements.eccentricity,
//         inclination: orbitalElements.inclination 
//     };
//     // const { inclination, eccentricity, semiMajorAxis } = orbitalElements;

//     // const orbitalElementsArray = [
//     //     ['inclination', inclination],
//     //     ['eccentricity', eccentricity],
//     //     ['semiMajorAxis', semiMajorAxis]
//     //   ];

//     // console.log("orbitalElements",orbitalElements)

//     // const orbitalElementsObject = Object.fromEntries(orbitalElementsArray);

   

//     //   console.log("orbitalElementsProperties",orbitalElementsObject)

      
//     const result = await session.run(
//       'CREATE (s:Satellite {name: $name, orbitalElements: $orbitalElements}) RETURN s',
//       { name, orbitalElements: orbitalElementsProperties }
//     );
//     return result.records[0].get('s').properties;
//   } finally {
//     await session.close();
//   }
}

async function updateSatellites(id,data) {
    return await Satellite.findByIdAndUpdate(id,data)
}

async function relationalSatellites() {
    return await Satellite.aggregate([
        {
            $match: {
              "relational_satellite": {
                $exists: true,
                $ne: []
              }
            }
        },
        {
            $lookup:{
              from:'satellites',
              localField:'relational_satellite',
              foreignField:'_id',
              as:'relational_satellite'
            }
        },
        {
            $unwind:{
              path:"$relational_satellite",
              preserveNullAndEmptyArrays:true
            },
        },
        {
            $group:{
                _id:"$relational_satellite",
                "relational_satellite": { "$push": "$$ROOT" } 
            }
        },
        {
            "$match": {
              "_id": { "$ne": null }
            }
        }
    ])
}

function calculateDistance(point1, point2) {
    console.log("point1",point1)
    console.log("point2",point2)

    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    console.log("dx",dx)
    console.log("dy",dy)
    console.log("dz",dz)
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

async function collisionSatellites() {
    let satellite = await Satellite.aggregate([
       
        { 
            $match:{
                moment_enabled:true
            }
        },
        {
            $lookup:{
              from:'satellites',
              localField:'relational_satellite',
              foreignField:'_id',
              as:'relational_satellite'
            }
        },
        {
            $unwind:{
              path:"$relational_satellite",
              preserveNullAndEmptyArrays:true
            },
        },
        // {
        //     $group:{
        //         _id:"$relational_satellite",
        //         "relational_satellite": { "$push": "$$ROOT" } 
        //     }
        // },
        // {
        //     "$match": {
        //       "_id": { "$ne": null }
        //     }
        // }
       
    ])

    // console.log("satellite 00",satellite)
    // console.log("satellite 11",satellite[0].position)
    // console.log("satellite 22",satellite[0].relational_satellite.position)
    const collisionThreshold = 1000;

    const collisionSatellitesArr = []
    satellite.forEach(async(s)=>{
        console.log("s here",s)
        const distance = calculateDistance(s?.position, s.relational_satellite.position);  
        if(distance < collisionThreshold){
            let priority = ['High','Low','Medium']
            let selectedPriority = ''
            if(distance <= 1000){
            
                if(distance > 850){
                    selectedPriority = priority[1]
                }else if(distance > 500 && distance < 850){
                    selectedPriority = priority[2]
                }else{
                    selectedPriority = priority[0]
                    await Satellite.findByIdAndUpdate(s?._id,{moment_enabled:false})
                }


                let obj = {satellite1:s?._id,satellite2:s?.relational_satellite?._id,distance:distance,selectedPriority,createdAt:new Date().toISOString()}

                console.log("obj",obj)
                await Collision.create(obj)
                collisionSatellitesArr.push(obj)
            }        
        }
    })
    return collisionSatellitesArr;
}

async function getAllcollisionSatellites(){
    return await Collision.aggregate([
        {
            $lookup:{
                from:'satellites',
                localField:'satellite1',
                foreignField:'_id',
                as:'satellite1'
            }
        },
        {
            $unwind:{
                path:"$satellite1",
                preserveNullAndEmptyArrays:true
            }
        },
        {
            $lookup:{
                from:'satellites',
                localField:'satellite2',
                foreignField:'_id',
                as:'satellite2'
            }
        },
        {
            $unwind:{
                path:"$satellite2",
                preserveNullAndEmptyArrays:true
            }
        }
    ])
}

async function getSatellitesById(id) {
    return await Satellite.findById(id)
}

async function getSatellitesByName(search_text) {
    return await Satellite.find({name: {$regex: search_text, '$options': 'i'}})
}

async function getAllSatellites() {
    return await Satellite.find()
}

async function deleteSatellites(id) {
    return await Satellite.findByIdAndDelete(id)
}

async function deleteAllSatellites() {
    return await Satellite.deleteMany({})
}


module.exports = {
  addSatellite,
  updateSatellites,
  collisionSatellites,
  getAllcollisionSatellites,
  getAllSatellites,
  getSatellitesById,
  deleteSatellites,
  deleteAllSatellites,
  getSatellitesByName,
  relationalSatellites
};