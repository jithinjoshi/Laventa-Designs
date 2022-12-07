const mongoose = require('mongoose');


const dbConnection = ()=>{
    try {
        mongoose.connect('mongodb://localhost:27017/ecommerceDB').then(()=>{
            console.log('Database connected successfully');
        })
    } catch (error) {
        console.log(error);   
    }
}

module.exports = dbConnection;