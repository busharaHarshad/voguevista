const express=require('express')
const app=express();
const dbConnect=require("./config/dbConnect")
const dotenv=require("dotenv").config()
const PORT=process.env.PORT||2600
dbConnect();
app.use(express.static('public'));
const session=require('express-session')
app.use(
    session({
        secret:process.env.SESSION_SECRET,
        resave:false,
        saveUninitilalized:false
    })
)


const userRoute=require('./routes/userRoute.js')
app.use('/',userRoute);

const adminRoute=require('./routes/adminRoute')
app.use('/admin',adminRoute);


app.listen(PORT,function(){
    console.log(`Server is Running...... AT PORT ${PORT}`)
})