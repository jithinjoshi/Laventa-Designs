const mongoose = require('mongoose');


const dbConnection = ()=>{
    try {
        console.log(process.env.DATABASE_URL)
        mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/ecommerceDB').then(()=>{
            console.log('Database connected successfully');
        })
    } catch (error) {
        console.log(error);   
    }
}

module.exports = dbConnection;