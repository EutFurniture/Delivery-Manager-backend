const express = require("express");
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');
const { name } = require('ejs');
const bcrypt = require('bcrypt');
const bodyParser =  require('body-parser')
const { response } = require('express');
const saltRounds = 10;

app.use(cors());
app.use(express.json());
app.set("view engine","ejs");

const db = mysql.createConnection({
    user: "root",
    host:"localhost",
    password:"",
    database:"eut_furniture",
    multipleStatements:true
});

app.post('/login', (req, res) => {

	const email = req.body.email
	const password = req.body.password
    
    console.log(email)
    console.log(password)
	db.query
	("SELECT * FROM userlogin WHERE u_email = ?;", 
	email, 
	(err, result)=> {

		if(err){
			res.send({err: err})
		}
        if(result){
            console.log(result);
			if (result.length > 0) {
				bcrypt.compare(password, result[0].u_password, (error, response)=>{
                    console.log(response);
                    if(response){
                        
						res.send(result);
					}else{
						res.send({message:"Invalid Username or Password!"})
					}
				})
			}else{
				res.send({message:"User doesn't exist"});
			}

            
		}}
	);
});


app.post('/addDelivers',(req,res)=>{
    
    const fullname = req.body.fullname
    const NIC = req.body.NIC
    const email = req.body.email
    
    const address = req.body.address
    const mobile = req.body.mobile
    const password = req.body.password
    const cpassword = req.body.cpassword
   
    bcrypt.hash(password,saltRounds,(err,hash)=>{
        
      if(err){
          console.log(err);
      }

      db.query("INSERT INTO employee(e_name, e_nic, e_email, e_phone, e_job_start_date, e_address, e_role, e_password, e_c_password) VALUES ( ?, ?, ?, ?,NOW(), ?,'Deliver', ?, ?); INSERT INTO userlogin (u_email,u_password,user_role) VALUES (?,?,'Deliver') ;", 
      [fullname,NIC,email ,mobile ,address ,hash ,hash,email,hash],(err,result)=>{
       
           
       if(result){
         res.send({message:"Successfully added"});
       }
      })
    
    })
    
});

{/*
    customer
    
    app.post('/addDelivers',(req,res)=>{
    
    const fullname = req.body.fullname
    const NIC = req.body.NIC
    const email = req.body.email
    
    const address = req.body.address
    const mobile = req.body.mobile
    const password = req.body.password
    const cpassword = req.body.cpassword
   
    bcrypt.hash(password,saltRounds,(err,hash)=>{
        
      if(err){
          console.log(err);
      }

      db.query("INSERT INTO customer (c_name, c_nic, c_email, c_phone_no, c_date,c_address, c_password, c_c_password) VALUES ( ?, ?, ?, ?,NOW(), ?, ?, ?); INSERT INTO userlogin (u_email,u_password,user_role) VALUES (?,?,'Customer') ;", 
      [fullname,NIC,email,mobile,address,hash,hash,email,hash],(err,result)=>{
       
            console.log(err);
       if(result){
         res.send({message:"Successfully added"});
       }
      })
    
    })
    
});

*/}


app.get("/delivers", (req, res) => {
    db.query("SELECT * FROM employee WHERE e_role='Deliver' ", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/orderstatus", (req, res) => {
    db.query("SELECT DISTINCT o_status FROM orders WHERE NOT o_status ='Processing'", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/paymentstatus", (req, res) => {
    db.query("SELECT DISTINCT payment_status FROM payment", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/deliverid", (req, res) => {
    db.query("SELECT employee_id FROM employee WHERE e_role='Deliver'", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/delivery", (req, res) => {
    db.query("SELECT orders.order_id,orders.employee_id,orders.order_last_date, orders.o_status,customer.c_name,customer.c_address FROM orders INNER JOIN customer ON orders.customer_id=customer.customer_id WHERE orders.o_status='Ready to deliver' OR orders.o_status='Completed' OR  orders.o_status='Returned' OR orders.o_status='Pending' OR orders.o_status='Scheduled' ORDER BY orders.order_id DESC", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/deliverys", (req, res) => {
    db.query("SELECT orders.order_id,orders.employee_id,orders.order_last_date, orders.o_status,customer.c_name,customer.c_address FROM orders INNER JOIN customer ON orders.customer_id=customer.customer_id WHERE  orders.o_status='Completed' OR  orders.o_status='Returned' OR orders.o_status='Scheduled' ORDER BY orders.order_id DESC LIMIT 8", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/Assign", (req, res) => {
    db.query("SELECT orders.order_id,orders.employee_id,orders.order_last_date,customer.c_address FROM orders INNER JOIN customer ON orders.customer_id=customer.customer_id WHERE orders.employee_id=0 ", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/viewStatus", (req, res) => {
    db.query("SELECT employee.employee_id,employee.e_name, COUNT(orders.o_status) AS pending FROM employee LEFT JOIN orders ON orders.employee_id=employee.employee_id WHERE (orders.o_status='Pending' OR orders.o_status='Scheduled' OR orders.o_status='Returned') AND employee.e_role='Deliver' GROUP BY employee.employee_id", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/getPriority", (req, res) => {
    db.query("SELECT orders.employee_id,orders.order_id,orders.order_last_date,orders.o_status,orders.o_priority FROM orders WHERE orders.o_status='Pending' UNION SELECT return_item.employee_id,return_item.order_id,return_item.reschedule_date,return_item.return_status, return_item.o_priority FROM return_item WHERE return_item.return_status='Scheduled' ORDER BY employee_id", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/viewReturn", (req, res) => {
    db.query("SELECT order_id,employee_id,return_date,reason,reschedule_date,return_status FROM return_item ORDER BY order_id DESC", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/cashOnDelivery", (req, res) => {
    db.query("SELECT orders.order_id,orders.employee_id,orders.total_price,orders.advance_price,payment.payment_status,orders.o_status FROM orders INNER JOIN payment ON orders.order_id=payment.order_id WHERE payment.payment_method='cash on delivery' ORDER BY orders.order_id DESC", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.get("/totalcashOnDelivery", (req, res) => {
    db.query("SELECT SUM(orders.total_price) AS total, SUM(orders.advance_price) AS advance FROM orders INNER JOIN payment ON orders.order_id = payment.order_id WHERE payment.payment_method = 'cash on delivery' AND payment.payment_status='Paid'", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});

app.post('/create', (req, res) => {
    console.log(req.body);
  
    const order_id = req.body.order_id;
    const product_id = req.body.product_id;
    const return_date = req.body.return_date;
    const reason = req.body.reason;

    db.query("INSERT INTO return_item ( order_id, product_id, return_date, reason) VALUES (?,?,?,?)" ,
     [ order_id, product_id, return_date, reason],
      (err,result) => {
          if(err){
          console.log(err)
          }else {
              res.send(result)
          }
     });
});


app.delete("/deleteDeliver/:employee_id",(req,res)=>{
    const employee_id = req.params.employee_id;
    const sqlDelete="DELETE FROM employee WHERE employee_id=?";

    db.query(sqlDelete,employee_id,(err,result)=>{
      if(err) console.log(err);
    });
  });


app.get("/viewAvailableDelivery", (req, res) => {
    const sql_View = "SELECT orders.order_id,orders.order_last_date,customer.c_address,customer.c_name, customer.c_phone_no FROM orders LEFT JOIN customer ON orders.customer_id=customer.customer_id ";
        db.query(sql_View, (err, result) => {
            res.send(result);
        });      
    });

    app.get("/viewDeliver",(req,res)=>{
        employee_id=req.params.employee_id;
        db.query("SELECT * FROM employee WHERE employee_id=?",[req.query.employee_id],(err,result)=>{
          console.log(req.query.employee_id);
          res.send(result);
        });
        
      });

app.get("/viewDeliveryDetails",(req,res)=>{
    order_id=req.params.order_id;
    db.query("SELECT orders.order_id,orders.employee_id,orders.order_last_date, orders.o_description,orders.o_d_date,orders.o_status,orders.o_date,customer.c_name,customer.c_address,customer.c_email,customer.c_phone_no FROM orders INNER JOIN customer ON orders.customer_id=customer.customer_id WHERE orders.order_id=?",[req.query.order_id],(err,result)=>{
        console.log(req.query.order_id);
        res.send(result);
    });
        
});

app.get("/viewReturnDetails",(req,res)=>{
    order_id=req.params.order_id;
    db.query("SELECT order_id,employee_id,return_date,reason,return_status FROM return_item WHERE order_id=?",[req.query.order_id],(err,result)=>{
        console.log(req.query.order_id);
        res.send(result);
    });
        
});

app.get("/viewPriorityDetails",(req,res)=>{
    order_id=req.params.order_id;
    db.query("SELECT orders.order_id,orders.o_priority FROM orders WHERE orders.order_id=?",[req.query.order_id],(err,result)=>{
        console.log(req.query.order_id);
        res.send(result);
    });
        
});

app.get("/viewDeliveryManager",(req,res)=>{
    employee_id=req.params.employee_id;

    db.query("SELECT * FROM employee WHERE e_role='DeliveryManager'",[req.query.employee_id],(err,result)=>{
        console.log(req.query.employee_id);
        res.send(result);
    });
        
});


app.get("/CashOnDeliveryDetails",(req,res)=>{
    order_id=req.params.order_id;
    db.query("SELECT orders.order_id,orders.employee_id,orders.order_last_date,orders.customer_id,orders.total_price,orders.advance_price,payment.payment_status,orders.o_status FROM orders INNER JOIN payment ON orders.order_id=payment.order_id WHERE orders.order_id=?",[req.query.order_id],(err,result)=>{
        console.log(req.query.order_id);
        res.send(result);
    });
        
});

app.put('/updateDeliveryStatus', (req,res) => {
    const order_id=req.body.order_id;
    const status = req.body.status;
    const Deliver_id= req.body.Deliver_id;

    db.query("UPDATE orders SET o_status=?, employee_id=? WHERE order_id = ?", 
    [status,Deliver_id,order_id], 
    (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
       }
    );
  });

  app.put('/AssignDeliver', (req,res) => {
    const order_id=req.body.order_id;
    const Deliver_id= req.body.Deliver_id;
    

    db.query("UPDATE orders SET  employee_id=?, o_status='Pending'  WHERE order_id = ?", 
    [Deliver_id,order_id], 
    (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send(result);
            
        }
       }
    );
  });

  app.put('/AssignPriority', (req,res) => {
    const order_id=req.body.order_id;
    const Priority_number= req.body.Priority_number;
    

    db.query("UPDATE orders SET o_priority=?  WHERE order_id = ? ; UPDATE return_item SET o_priority=? WHERE order_id=?;", 
    [Priority_number,order_id,Priority_number,order_id], 
    (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
       }
    );
  });

  app.put('/ReturnSchedule', (req,res) => {
    const order_id=req.body.order_id;
    const Schedule_date= req.body.Schedule_date;

    db.query("UPDATE return_item SET reschedule_date=?,return_status='Scheduled' WHERE order_id=?; UPDATE orders SET order_last_date=?,o_status='Scheduled' WHERE order_id=?", 
    [Schedule_date,order_id,Schedule_date,order_id], 
    (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
       }
    );
  });

  app.put('/updateCashStatus', (req,res) => {
    const order_id=req.body.order_id;
    const status = req.body.status;
    const Payment= req.body.Payment;

    db.query("UPDATE payment SET payment_status=? WHERE order_id = ?; UPDATE orders SET o_status=? WHERE order_id = ?", 
    [Payment,order_id,status,order_id], 
    (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
       }
    );
  });

  app.put('/updateReturnStatus', (req,res) => {
    const order_id=req.body.order_id;
    const status = req.body.status;

    db.query("UPDATE orders SET o_status=? WHERE order_id = ?; UPDATE return_item SET return_status=? WHERE order_id=?", 
    [status,order_id,status,order_id], 
    (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
       }
    );
  });

  app.put('/UpdateDelivers', (req,res) => {
    const employee_id=req.body.employee_id;
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;

    db.query("UPDATE employee SET e_name=?,e_email=?,e_phone=?,e_address=? WHERE employee_id = ?", 
    [name,email,phone,address,employee_id], 
    (err, result) => {

        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
       }
    );
  });

  app.get("/viewDeliverySchedule", (req, res) => {
    db.query("SELECT order_id, employee_id, o_date, order_last_date FROM orders ORDER BY order_last_date DESC", (err, result, fields) => {
        if (err) {
            console.log(err);
        } else{
            res.send(result);
        }
    });
});
  
app.listen(3001, () => {
    console.log("yay your server is running on port 3001");
});
