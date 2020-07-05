const express = require('express');
const app = express();
port = 3000;
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://root@localhost:3306/delilah_resto');
const bcrypt = require('bcrypt');
const signature = 'my_secret_key';
app.use(bodyParser.json());



//==> validando que los espacios de refistro de usuarios no esten vacios
function validateSignupFields(req, res, next){
    const {nickname, name_last_name, email, phone_number, direction, password} = req.body;
    if(!nickname || !name_last_name || !email || !phone_number || !direction || !password){
        res.status(400).json("all fields are required");
    }else{
        res.status(200);
        next();
    }
}

//==> si no hay info en la tabla usuarios registre el primero como superadmin
function validate_super_admin(req, res, next){
    sequelize.query('SELECT * FROM users', {
        type: sequelize.QueryTypes.SELECT
    }).then((user)=>{
        if(user.length == 0){
            const {nickname, name_last_name, email, phone_number, direction, password} = req.body;
            //encrypting password by using bcrypt
            const encrypted_password = bcrypt.hashSync(password, 10);
            sequelize.query('INSERT INTO users VALUES (NULL,?,?,?,?,?,?,?)', {
                replacements: [nickname, name_last_name, email, phone_number, direction, encrypted_password, 'superAdmin']
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

//==> Validando si ya existe un usuario con ese nickname o con ese email
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
            res.json("user name or email were already taken");
        }else{
            next();
        }
    });
}

function validateUserAndPassword(req, res, next){
    const {nickname_email, password} = req.body;
    //Requerimos toda la info de la tabla users
    sequelize.query('SELECT * FROM users', {
        type: sequelize.QueryTypes.SELECT
    }).then((all_users)=>{
        let t = false;
        if(all_users){
            for(i of all_users){
                var compare_passwords = bcrypt.compareSync(password, i.password);
                if(i.nickname == nickname_email && compare_passwords == true || i.email == nickname_email && compare_passwords == true){
                    t = true;
                }
            }
            if(t == true){
                res.status(200);
                next();
            }else{
                res.json("wrong user or password");
            }
        }
    });
}

//===> asegurandose que el token exista 
//==> El toquen se debe crear previamente en el login, es decir una vez el usuario y la contraseña sean correctos, se crea un token
//para ese usuario

function ensuringtoken(req, res, next){
    //en la ruta login creamos el token
    //la constante bererHeader en el req recibe las cabeceras(ahi va el token) desde el postman + el metodo autorization
    const beredHeader = req.headers.authorization;
    //si existe beredHeader osea si se envió desde postman la cabecera
    if(beredHeader){
        //la cabera suele venir asi BEARER dñsñfd2fd1f31df31fd(el token) como cadena de texto,
        //le decimos que cree un array donde haya " "
        const bearer = beredHeader.split(" ");
        //queremos la posicion 1 de ese array osea el token
        const bearerToken = bearer[1];
        req.token = bearerToken;
        //el token que he creado se lo adjunto a la peticion con req en una propiedad que yo creo llamada token
        //con esto lo puedo llamar en cualquier ruta (este toquen lleva toda la info del usuario);
        next();
    }else{
        res.status(403).json("invalid token");
    }
}

//vamos a validar que el token que se creo en la ruta login, y que se envio desde el middleware ensuringToken tenga en la propiedad rol el valor superAdmin 
function validate_superAdmin_by_token(req, res, next){
    const decoded = jwt.verify(req.token, signature);
    if(decoded.rol === "superAdmin"){
        next();
    }else{
        res.json("this user doesnt have enough privileges")
    }
}

//vamos a validar que el token que se creo en la ruta login, y que se envio desde el middleware ensuringToken tenga en la propiedad rol el valor superAdmin o el valor de admin
function validate_superAdmin_and_admin_by_token(req, res, next){
    const decoded = jwt.verify(req.token, signature);
    if(decoded.rol === "superAdmin" || decoded.rol === "admin"){
        next();
    }else{
        res.json("this user doesnt have enough privileges")
    }
}

//vamos a validar que el producto que se esta insertando no esté previamente guardado en la tabla products
function validate_existing_product(req, res, next){
    const {product_name} = req.body;
    let verify_product_name = false;
    sequelize.query('SELECT * FROM products', {
        type: Sequelize.QueryTypes.SELECT
    }).then(all_products => {
        for(i of all_products){
            if(i.product_name == product_name){
                verify_product_name = true;
            }
        }
        if(verify_product_name === true){
            res.json("this product already exist");
        }else{
            next();
        }
    });
}


//validando que el nuevo producto creado o editado no lleve los campos vacios
function validate_newProducts_fields(req, res, next){
    const {product_name, price_per_unit} = req.body;
    if(!product_name || !price_per_unit){
        res.status(401).json("all fields are required");
    }else{
        next();
    }
}


//verificamos que sea un usuario con rol usuario pueda acceder a su informacion (solo un usuario con rol user podraa cceder a esa ruta)
function validate_user_rol(req, res, next){
    const decoded = jwt.verify(req.token, signature);
    if(decoded.rol === "user"){
        next()
    }else{
        res.json("impossible to get info");
    }
}


/*====================================================================================================
END POINTS 
=======================================================================================================*/

app.get('/protected', ensuringtoken, (req, res)=>{
    //ahora esta ruta esta protegida, se debe enviar la cabecera desde el postman para poder acceder a esta ruta 
    //en el postman click en cabeceras, y enviamos la info así


    /*

    ------------------------------------------------------------------
    |        key            |                value                    |
    ------------------------------------------------------------------
    |     Authorization     |  Bearer +token_generado_en_el_login     |
    ------------------------------------------------------------------

    ------------------------------
    |    key      | value        |
    ------------------------------
    |Authorization|Bearer + token|
    ------------------------------
    
    */

    //res.json("ruta protegida");
    const decoded = jwt.verify(req.token, signature);
    res.json(decoded);
});

//===> SIGN UP  Registrar nuevo usuario

app.post('/deliah/signup', [validateSignupFields, validate_super_admin, validate_taken_user], (req, res)=>{
    const {nickname, name_last_name, email, phone_number, direction, password} = req.body;
    //encrypting password by bcrypt 
    const encrypted_password = bcrypt.hashSync(password, 10);
    sequelize.query('INSERT INTO users VALUES (NULL,?,?,?,?,?,?,?)', {
        replacements: [nickname, name_last_name, email, phone_number, direction, encrypted_password, 'user']
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

//==>LOG IN logeando usuarios, creando token  
app.post('/deliah/login', [validateUserAndPassword], (req, res)=>{
    const {nickname_email} = req.body;
    sequelize.query('SELECT * FROM users WHERE nickname = ? or email = ?',{
        type: Sequelize.QueryTypes.SELECT,
        replacements: [nickname_email, nickname_email,]
    }).then((user_info)=>{
        if(user_info){
            for(i of user_info){
                //i representa el objeto que coincidio con todas sus propiedades
                //creando nuevo token para el usuario
                const token = jwt.sign(i, signature);
                //este toquen lo copiamos y lo enviamos en las cabeceras, creaamos el middleware ensuringtoken
                res.json(token);
            }
        }else{
            res.json("impossible to create token for this user");
        }
    }).catch(err=>{
        res.json(err);
    });
});


//==>super admin creando mas admins
//1. validamos que exista el token, validamos que el usuario sea admin

app.post('/deliah/superadmin/newadmin', [ensuringtoken, validate_superAdmin_by_token, validateSignupFields, validate_taken_user], (req, res)=>{
    const {nickname, name_last_name, email, phone_number, direction, password} = req.body;
    const encrypted_password = bcrypt.hashSync(password, 10);
    sequelize.query('INSERT INTO users VALUES (NULL, ?,?,?,?,?,?,?)', {
        replacements: [nickname, name_last_name, email, phone_number, direction, encrypted_password, 'admin']
    }).then((new_admin)=>{
        if(new_admin){
            res.status(200).json("added new admin");
        }
    }).catch((err)=>{
        if(err){
            res.status(403).json("impossible to add new admin");
        }
    });
});

//==>super admin eliminando los admins que creo
app.delete('/deliah/superadmin/deleteadmin/:id',[ensuringtoken, validate_superAdmin_by_token], (req, res)=>{
    const id = req.params.id;
    sequelize.query('DELETE FROM users WHERE user_id = ? AND rol = ?', {
        replacements: [id, 'admin']
    }).then((delete_admin)=>{
        if(delete_admin){
            res.status(200).json("admmin successfully deleted")
        }
    }).catch((err)=>{
        if(err){
            res.status(500).json("impossible to delete this admin");
        }
    });
});




//==> admin y super admin agregando productos 

app.post('/deliah/admin/addproduct', [ensuringtoken, validate_superAdmin_and_admin_by_token,  validate_newProducts_fields, validate_existing_product], (req, res)=>{
    const {product_name, price_per_unit} = req.body;
    sequelize.query('INSERT INTO products (product_name, price_per_unit) VALUES (?,?)', {
        replacements: [product_name, price_per_unit]
    }).then((new_product)=>{
        if(new_product){
            res.status(200).json("new products successfully created");
        }
    }).catch((err)=>{
        if(err){
            res.status(403).json("impossible to create new product");
        }
    });
});

//==> admin y super admin eliminando productos 

app.delete('/deliah/admin/deleteproduct/:id', [ensuringtoken, validate_superAdmin_and_admin_by_token], (req, res)=>{
    const id = req.params.id;
    sequelize.query('DELETE FROM products WHERE product_id = ?', {
        replacements: [id]
    }).then((deleted_product)=>{
        if(deleted_product){
            res.status(200).json("product has been deleted");
        }
    }).catch((err)=>{
        if(err){
            res.status(403).json("impossible to delete product");
        }
    });
});

//==> admin y super admin editando productos completos
app.put('/deliah/admin/editfullproduct/:id', [ensuringtoken, validate_superAdmin_and_admin_by_token,  validate_newProducts_fields], (req, res)=>{
    const id = req.params.id;
    const {product_name, price_per_unit} = req.body;
    sequelize.query('UPDATE products SET product_name = ?, price_per_unit = ? WHERE product_id = ?', {
        replacements: [product_name, price_per_unit, id]
    }).then((new_info)=>{
        if(new_info){
            res.status(200).json("product has been edited correctly");
        }
    }).catch((err)=>{
        res.json(err);
    });
});


//==> admin y super admin trayendo todos los usuarios por roll
app.get('/deliah/admin/users/:rol', [ensuringtoken, validate_superAdmin_and_admin_by_token], (req, res)=>{
    const rol = req.params.rol;

    //trayendo todos los usuarios independientemente del rol
   if(rol == "allusers"){
       sequelize.query('SELECT * FROM users', {
            type: Sequelize.QueryTypes.SELECT
       }).then((all_users)=>{
            res.json(all_users);
       }).catch((err)=>{
            res.json(err);
       });
   }

   //trayendo usuarios por rol
    sequelize.query('SELECT * FROM users WHERE rol = ?', {
        type: Sequelize.QueryTypes.SELECT,
        replacements: [rol]
    }).then((users_by_rol)=>{
        res.json(users_by_rol);
    }).catch((err)=>{
        res.json(err);
    });
});




//==> usuario con rol usuario trayendo su propia infromacion // no trae nada si se envia el id pero el rol no es user
app.get('/deliah/user/info/:id', [ensuringtoken, validate_user_rol], (req, res)=>{
    const id = req.params.id;
    sequelize.query('SELECT * FROM users WHERE user_id = ? AND rol = ?', {
        type: sequelize.QueryTypes.SELECT,
        replacements: [id, 'user']
    }).then((rol_user_info)=>{
        if(rol_user_info){
            res.json(rol_user_info);
        }
    }).catch((err)=>{
        res.json(err);
    });
});






























app.listen(port, ()=>{
    console.log("currently running on port 3000");
})