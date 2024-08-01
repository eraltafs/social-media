const mongoose= require("mongoose");

const PremiumUserSchema=mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true
    },
    plan:{
        type:Number,
        enum:[7,12,21],
        require:true
    },
    planStartDate:{
        type:Date
    },
    planEndDate:{
        type:Date
    },
    paymentStatus:{
        type:String,
        enum:["pending", "failed", "success"]
    }
})

module.exports= mongoose.model("PremiumUser",PremiumUserSchema);