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

//==> validando que los espacios de registro de usuarios no esten vacios
function validateSignupFields(req, res, next) {
    const { nickname, name_last_name, email, phone_number, direction, password } = req.body;
    if (!nickname || !name_last_name || !email || !phone_number || !direction || !password) {
        res.status(400).json("all fields are required");
    } else {
        res.status(200);
        next();
    }
}

//==> si no hay info en la tabla usuarios registre el primero como superadmin
function validate_super_admin(req, res, next) {
    sequelize.query('SELECT * FROM users', {
        type: sequelize.QueryTypes.SELECT
    }).then((user) => {
        if (user.length == 0) {
            const { nickname, name_last_name, email, phone_number, direction, password } = req.body;
            const encrypted_password = bcrypt.hashSync(password, 10);
            sequelize.query('INSERT INTO users VALUES (NULL,?,?,?,?,?,?,?)', {
                replacements: [nickname, name_last_name, email, phone_number, direction, encrypted_password, 'superAdmin']
            }).then((new_super_admin) => {
                if (new_super_admin) {
                    res.status(200).json("new super admin was successfully created");
                }
            }).catch((err) => {
                if (err) {
                    res.status(403).json("impossible to create new admin");
                }
            })
        } else {
            next();
        }
    });
}

//==> Validando si ya existe un usuario con ese nickname o con ese email
function validate_taken_user(req, res, next) {
    const { email, nickname } = req.body;
    sequelize.query('SELECT * FROM users', {
        type: sequelize.QueryTypes.SELECT
    }).then((all_users) => {
        var validate_existing_user = false;
        for (let i of all_users) {
            if (i.email == email || i.nickname == nickname) {
                validate_existing_user = true
            }
        }
        if (validate_existing_user == true) {
            res.json("user name or email were already taken");
        } else {
            next();
        }
    });
}

function validateUserAndPassword(req, res, next) {
    const { nickname_email, password } = req.body;
    //Requerimos toda la info de la tabla users
    sequelize.query('SELECT * FROM users', {
        type: sequelize.QueryTypes.SELECT
    }).then((all_users) => {
        let t = false;
        if (all_users) {
            for (i of all_users) {
                var compare_passwords = bcrypt.compareSync(password, i.password);
                if (i.nickname == nickname_email && compare_passwords == true || i.email == nickname_email && compare_passwords == true) {
                    t = true;
                }
            }
            if (t == true) {
                res.status(200);
                next();
            } else {
                res.json("wrong user or password");
            }
        }
    });
}

//===> asegurandose que el token exista 
function ensuringtoken(req, res, next) {
    const beredHeader = req.headers.authorization;
    if (beredHeader) {
        const bearer = beredHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.status(403).json("invalid token");
    }
}

//vamos a validar que el token que se creo en la ruta login, y que se envio desde el middleware ensuringToken tenga en la propiedad rol el valor superAdmin 
function validate_superAdmin_by_token(req, res, next) {
    const decoded = jwt.verify(req.token, signature);
    if (decoded.rol === "superAdmin") {
        next();
    } else {
        res.json("this user doesnt have enough privileges")
    }
}

//validar que el token que se creo en la ruta login, y que se envio desde el middleware ensuringToken tenga en la propiedad rol el valor superAdmin o el valor de admin
function validate_superAdmin_and_admin_by_token(req, res, next) {
    const decoded = jwt.verify(req.token, signature);
    if (decoded.rol === "superAdmin" || decoded.rol === "admin") {
        next();
    } else {
        res.json("this user doesnt have enough privileges")
    }
}

//validar que el producto que se esta insertando no esté previamente guardado en la tabla products
function validate_existing_product(req, res, next) {
    const { product_name } = req.body;
    let verify_product_name = false;
    sequelize.query('SELECT * FROM products', {
        type: Sequelize.QueryTypes.SELECT
    }).then(all_products => {
        for (i of all_products) {
            if (i.product_name == product_name) {
                verify_product_name = true;
            }
        }
        if (verify_product_name === true) {
            res.json("this product already exist");
        } else {
            next();
        }
    });
}

//validando que el nuevo producto creado o editado no lleve los campos vacios
function validate_newProducts_fields(req, res, next) {
    const { product_name, price_per_unit } = req.body;
    if (!product_name || !price_per_unit) {
        res.status(401).json("all fields are required");
    } else {
        next();
    }
}

//verificamos que sea un usuario con rol usuario pueda acceder a su informacion (solo un usuario con rol user podraa cceder a esa ruta)
function validate_user_rol(req, res, next) {
    const decoded = jwt.verify(req.token, signature);
    if (decoded.rol === "user") {
        next()
    } else {
        res.json("impossible to get info");
    }
}


/*====================================================================================================
END POINTS 
=======================================================================================================*/

//===> SIGN UP  Registrar nuevo usuario
app.post('/deliah/signup', [validateSignupFields, validate_super_admin, validate_taken_user], (req, res) => {
    const { nickname, name_last_name, email, phone_number, direction, password } = req.body;
    //encrypting password by bcrypt 
    const encrypted_password = bcrypt.hashSync(password, 10);
    sequelize.query('INSERT INTO users VALUES (NULL,?,?,?,?,?,?,?)', {
        replacements: [nickname, name_last_name, email, phone_number, direction, encrypted_password, 'user']
    }).then(new_user => {
        if (new_user){
            res.status(200).json("new user has been created successfully");
        }
    }).catch((err) => {
        if (err) {
            res.status(400).json("impossible to create new user");
        }
    });
});

//==>LOG IN logeando usuarios, creando token  
app.post('/deliah/login', [validateUserAndPassword], (req, res) => {
    const { nickname_email } = req.body;
    sequelize.query('SELECT * FROM users WHERE nickname = ? or email = ?', {
        type: Sequelize.QueryTypes.SELECT,
        replacements: [nickname_email, nickname_email,]
    }).then((user_info) => {
        if (user_info) {
            for (i of user_info) {
                //i representa el objeto que coincidio con todas sus propiedades
                //creando nuevo token para el usuario
                const token = jwt.sign(i, signature);
                //este toquen lo copiamos y lo enviamos en las cabeceras, creaamos el middleware ensuringtoken
                res.json(token);
            }
        } else {
            res.json("impossible to create token for this user");
        }
    }).catch(err => {
        res.json(err);
    });
});


//==>super admin creando mas admins
app.post('/deliah/superadmin/newadmin', [ensuringtoken, validate_superAdmin_by_token, validateSignupFields, validate_taken_user], (req, res) => {
    const { nickname, name_last_name, email, phone_number, direction, password } = req.body;
    const encrypted_password = bcrypt.hashSync(password, 10);
    sequelize.query('INSERT INTO users VALUES (NULL, ?,?,?,?,?,?,?)', {
        replacements: [nickname, name_last_name, email, phone_number, direction, encrypted_password, 'admin']
    }).then((new_admin) => {
        if (new_admin) {
            res.status(200).json("added new admin");
        }
    }).catch((err) => {
        if (err) {
            res.status(403).json("impossible to add new admin");
        }
    });
});

//==>super admin eliminando los admins que creo
app.delete('/deliah/superadmin/deleteadmin/:id', [ensuringtoken, validate_superAdmin_by_token], (req, res) => {
    const id = req.params.id;
    sequelize.query('DELETE FROM users WHERE user_id = ? AND rol = ?', {
        replacements: [id, 'admin']
    }).then((delete_admin) => {
        if (delete_admin) {
            res.status(200).json("admmin successfully deleted")
        }
    }).catch((err) => {
        if (err) {
            res.status(500).json("impossible to delete this admin");
        }
    });
});


//==> admin y super admin agregando productos 
app.post('/deliah/admin/addproduct', [ensuringtoken, validate_superAdmin_and_admin_by_token, validate_newProducts_fields, validate_existing_product], (req, res) => {
    const { product_name, price_per_unit } = req.body;
    sequelize.query('INSERT INTO products (product_name, price_per_unit) VALUES (?,?)', {
        replacements: [product_name, price_per_unit]
    }).then((new_product) => {
        if (new_product) {
            res.status(200).json("new products successfully created");
        }
    }).catch((err) => {
        if (err) {
            res.status(403).json("impossible to create new product");
        }
    });
});

//==> admin y super admin eliminando productos 
app.delete('/deliah/admin/deleteproduct/:id', [ensuringtoken, validate_superAdmin_and_admin_by_token], (req, res) => {
    const id = req.params.id;
    sequelize.query('DELETE FROM products WHERE product_id = ?', {
        replacements: [id]
    }).then((deleted_product) => {
        if (deleted_product) {
            res.status(200).json("product has been deleted");
        }
    }).catch((err) => {
        if (err) {
            res.status(403).json("impossible to delete product");
        }
    });
});

//==> admin y super admin editando productos completos
app.put('/deliah/admin/editfullproduct/:id', [ensuringtoken, validate_superAdmin_and_admin_by_token, validate_newProducts_fields], (req, res) => {
    const id = req.params.id;
    const { product_name, price_per_unit } = req.body;
    sequelize.query('UPDATE products SET product_name = ?, price_per_unit = ? WHERE product_id = ?', {
        replacements: [product_name, price_per_unit, id]
    }).then((new_info) => {
        if (new_info) {
            res.status(200).json("product has been edited correctly");
        }
    }).catch((err) => {
        res.json(err);
    });
});


//==> admin y super admin trayendo todos los usuarios por roll
app.get('/deliah/admin/users/:rol', [ensuringtoken, validate_superAdmin_and_admin_by_token], (req, res) => {
    const rol = req.params.rol;
    //trayendo todos los usuarios independientemente del rol
    if (rol == "allusers") {
        sequelize.query('SELECT * FROM users', {
            type: Sequelize.QueryTypes.SELECT
        }).then((all_users) => {
            res.json(all_users);
        }).catch((err) => {
            res.json(err);
        });
    }

    //trayendo usuarios por rol
    sequelize.query('SELECT * FROM users WHERE rol = ?', {
        type: Sequelize.QueryTypes.SELECT,
        replacements: [rol]
    }).then((users_by_rol) => {
        res.json(users_by_rol);
    }).catch((err) => {
        res.json(err);
    });
});


//==> usuario con rol usuario trayendo su propia infromacion // no trae nada si se envia el id pero el rol no es user
app.get('/deliah/user/info/:id', [ensuringtoken, validate_user_rol], (req, res) => {
    const id = req.params.id;
    const user_nickname = jwt.verify(req.token, signature);
    const nickname_from_user = user_nickname.nickname;

    sequelize.query('SELECT * FROM users WHERE user_id = ? AND nickname = ?', {
        type: sequelize.QueryTypes.SELECT,
        replacements: [id, nickname_from_user]
    }).then((rol_user_info) => {
        if (rol_user_info != "") {
            res.json(rol_user_info);
        }else{
            res.json("Impossible to get info from this user");
        }
    }).catch((err) => {
        res.json(err);
    });
});


//====> Usuarios pidiendo ordenes 
app.post('/deliah/user/neworder', ensuringtoken, (req, res) => {
    const { products } = req.body;
    const user_id = jwt.verify(req.token, signature);
    const id_from_user = user_id.user_id;

    sequelize.query('INSERT INTO orders (user_id) VALUES (?)', {
        replacements: [id_from_user]
    }).then((insert_user_id)=>{
        if(insert_user_id){
            insert_into_table_products_per_order(req, res, products);
        }
    });
   
    function insert_into_table_products_per_order(req,res,products) {
        sequelize.query('SELECT max(id_order) as "id" FROM orders WHERE user_id = ?', {
            type: Sequelize.QueryTypes.SELECT,
            replacements: [id_from_user]
        }).then((orders) => {
            const order_id = orders[0].id
            products.forEach(product => {
                c = product.product_id;
                d = product.quantity;
                sequelize.query('INSERT INTO products_per_order (id_order, product_id, quantity) VALUES (?,?,?)', {
                    replacements: [order_id, c, d]
                }).then((insert) => {
                    res.json(insert);
                }).catch((err) => {
                    res.json(err);
                });
            });
        });
    }
});

//==> Admin y superAdmin obteniendo todos los pedidos
app.get('/deliah/admin/orders', [ensuringtoken, validate_superAdmin_and_admin_by_token], (req, res)=>{
    sequelize.query('SELECT orders.status, orders.hour, orders.id_order, products_per_order.quantity, products.product_name, products.price_per_unit, users.nickname, users.direction FROM users JOIN orders ON users.user_id = orders.user_id JOIN products_per_order ON products_per_order.id_order = orders.id_order JOIN products ON products.product_id = products_per_order.product_id', {
        type: Sequelize.QueryTypes.SELECT
    }).then((all_orders)=>{
        res.status(200).json(all_orders);
    }).catch((err)=>{
        res.status(400).json(err);
    });
});


//==> Admin y superAdmin cambiando status de la orden obteniendola por id
app.put('/deliah/admin/ordersstatus/:id', [ensuringtoken, validate_superAdmin_and_admin_by_token], (req, res)=>{
    const id_order = req.params.id;
    const {status} = req.body;
    sequelize.query('UPDATE orders SET status = ? WHERE id_order = ?',{
        replacements: [status, id_order]
    }).then((change_status)=>{
        res.json(change_status);
    }).catch((err)=>{
        res.json(err);
    })
});

//admin y superadmin obteniendo las ordenes por id 
app.get('/deliah/admin/orders/:id', [ensuringtoken, validate_superAdmin_and_admin_by_token], (req, res)=>{
    const id_order = req.params.id;
    sequelize.query('SELECT orders.status, orders.hour, orders.id_order, products_per_order.quantity, products.product_name, products.price_per_unit, users.nickname, users.direction FROM users JOIN orders ON users.user_id = orders.user_id JOIN products_per_order ON products_per_order.id_order = orders.id_order JOIN products ON products.product_id = products_per_order.product_id WHERE orders.id_order = ?', {
        type: Sequelize.QueryTypes.SELECT,
        replacements: [id_order]
    }).then((order_by_id)=>{
        res.json(order_by_id)
    }).catch((err)=>{
        res.json(err);
    });
});


//==> admin y super admin eliminando ordenes por id 
app.delete('/deliah/admin/orders/deleteorder/:id', [ensuringtoken, validate_superAdmin_and_admin_by_token], (req, res)=>{
    const id = req.params.id
    sequelize.query('DELETE FROM orders WHERE id_order = ?', {
        replacements: [id]
    }).then((deleted_order)=>{
        if(deleted_order){
            res.status(200).json("this order has been deleted")
        }
    }).catch((err)=>{
        if(err){
            res.status(403).json("impossible to delete order");
        }
    })
});

//==> usuario cambiando el stado de su orden por cancelado
app.put('/deliah/user/orderstatus/:id',[ensuringtoken, validate_user_rol], (req, res)=>{
    const cancel_order = req.body.status;
    const order_id = req.params.id;
    //obteniendo el id del usuario que inicio sesion y va a hacer la orden (viene en el token)
    const user_id = jwt.verify(req.token, signature);
    const id_from_user = user_id.user_id;
    if(cancel_order === "cancelado"){
        sequelize.query('UPDATE orders SET status = ? WHERE id_order = ? AND user_id = ?', {
            replacements: [cancel_order, order_id, id_from_user]
        }).then((canceled_order)=>{
            if(canceled_order){
                for(i of canceled_order){
                    if(i.affectedRows == 0){
                        res.status(403).json("impossible update order status, or this order has been already canceled");
                    }else{
                        res.status(200).json("this order has been canceled")
                    }
                }
            }
        }).catch((err)=>{
            res.json(err);
        });
    }else{
        res.json("you only can cancel orders here by writing cancelado");
    }
});


//==> usuario obteniendo sus ordenes
app.get('/deliah/user/getorders', [ensuringtoken, validate_user_rol], (req, res)=>{
    const id_from_user = jwt.verify(req.token, signature);
    const user_id = id_from_user.user_id;
    sequelize.query('SELECT orders.status, orders.hour, orders.id_order, products_per_order.quantity, products.product_name, products.price_per_unit, users.nickname, users.direction FROM users JOIN orders ON users.user_id = orders.user_id JOIN products_per_order ON products_per_order.id_order = orders.id_order JOIN products ON products.product_id = products_per_order.product_id WHERE users.user_id = ?', {
        type: Sequelize.QueryTypes.SELECT,
        replacements: [user_id]
    }).then((all_user_orders)=>{
        if(all_user_orders != ""){
            res.status(200).json(all_user_orders)
        }else{
            res.json("this user doesn't have orders yet")
        }
    }).catch((err)=>{
        res.json(err);
    })
});

app.listen(port, () => {
    console.log("currently running on port 3000");
});




