const express = require('express');
const app = express();
port = 3000;
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://root@localhost:3306/delilah_resto');
app.use(bodyParser.json());

/*====================================================================================================

MIDDLEWARES 

=======================================================================================================*/



//==> middleware to verify empty fields

function validateFields(req, res, next){
    const {nickname, name_last_name, email, phone_number, direction, password} = req.body;
    if(!nickname || !name_last_name || !email || !phone_number || !direction || !password){
        res.status(400).json("all fields are required");
    }else{
        res.status(200);
        next();
    }
}



//==> if thereisnt info in table user sign up the first one as super admin

function validate_super_admin(req, res, next){
    sequelize.query('SELECT * FROM users', {
        type: sequelize.QueryTypes.SELECT
    }).then((user)=>{
        if(user.length == 0){
            const {nickname, name_last_name, email, phone_number, direction, password} = req.body;
            sequelize.query('INSERT INTO users VALUES (NULL,?,?,?,?,?,?,?)', {
                replacements: [nickname, name_last_name, email, phone_number, direction, password, 'admin']
            }).then((new_super_admin)=>{
                if(new_super_admin){
                    res.status(200).json("new super admin was successfully created");
                }
            }).catch((err)=>{
                if(err){
                    res.status(403).json("impossible to create new admin");
                }
            })
        }else{
            next();
        }
    });
}

//==> Validate an user already taken by email and nickname

function validate_taken_user(req, res, next){
    const {email, nickname} = req.body;
    sequelize.query('SELECT * FROM users', {
        type: sequelize.QueryTypes.SELECT
    }).then((all_users)=>{
        var validate_existing_user = false;
        for (let i of all_users){
            if(i.email == email || i.nickname == nickname){
                validate_existing_user = true
            }
        }
        if(validate_existing_user == true){
            res.json("this user already exist");
        }else{
            next();
        }

        // -----> Tambien se podría hacer de esta manera, validando pero solo con una propiedad, validando una sola propiedad como email, si hay coincidencia entre el nuevo usuario que viene de postman y alguno de los que esta en la bd

        //    const validate_existing_email_index = all_users.findIndex(c=>{
        //     return c.email = email;
        //    });
        //    if(validate_existing_email_index >= 0){
        //        res.json("this contact already exist");
        //    }else{
        //        next();
        //        res.json({});
        //    }
    });
}




/*====================================================================================================

END POINTS 

=======================================================================================================*/


app.post('/signup', [validateFields, validate_super_admin, validate_taken_user], (req, res)=>{
    const {nickname, name_last_name, email, phone_number, direction, password} = req.body;
    sequelize.query('INSERT INTO users VALUES (NULL,?,?,?,?,?,?,?)', {
        replacements: [nickname, name_last_name, email, phone_number, direction, password, 'user']
    }).then(new_user =>{
        if(new_user){
            res.status(200).json("new user has been created successfully");
        }
    }).catch((err)=>{
        if(err){
            res.status(403).json("impossible to create new user");
        }
    });
});


















app.listen(port, ()=>{
    console.log("currently running on port 3000");
})