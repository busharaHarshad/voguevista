const  {default:mongoose}=require('mongoose')

const dbConnect=()=>{
  try{
  const conn =mongoose.connect(process.env.MONGODB_URL)
  console.log("database connected succesfully")
  }catch(error){
    console.log("error.message")
  }
}

module.exports=dbConnect;