import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import "./firebase-admin.js";

export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({
message:"Method not allowed"
});
}

try {

const authHeader = req.headers.authorization;

if(!authHeader || !authHeader.startsWith("Bearer ")){
return res.status(401).json({
message:"Unauthorized"
});
}


const token = authHeader.split("Bearer ")[1];

const decodedToken =
await getAuth().verifyIdToken(token);


const userId = decodedToken.uid;


const { voucherCode } = req.body;


if(!voucherCode){
return res.status(400).json({
message:"Voucher code required"
});
}


const cleanCode =
voucherCode.trim().toUpperCase();


const db = getDatabase();


const voucherRef =
db.ref(`vouchers/${cleanCode}`);


const snapshot =
await voucherRef.once("value");


if(!snapshot.exists()){

return res.status(404).json({
message:"Invalid voucher"
});

}


const voucher =
snapshot.val();



if(voucher.isUsed){

return res.status(400).json({
message:"Voucher already used"
});

}



const amount =
Number(voucher.amount);



await db.ref(`users/${userId}/wallet`)
.transaction(wallet=>{

return (Number(wallet)||0)+amount;

});



await voucherRef.update({

isUsed:true,
usedBy:userId,
usedAt:Date.now()

});



const tx =
db.ref("transactions").push();


await tx.set({

transactionId:
"VCR-"+Date.now(),

uid:userId,

type:"Voucher Redeem",

amount,

status:"completed",

createdAt:Date.now()

});



return res.status(200).json({

success:true,

message:
`₦${amount.toLocaleString()} added to wallet`

});


}
catch(error){

console.error(error);

return res.status(500).json({

message:error.message

});

}

}
