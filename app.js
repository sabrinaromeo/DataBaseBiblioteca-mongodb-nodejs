


const express= require('express'); //declaro una variable express para indicar que voy a usar express

const mongoose = require('mongoose');//declaramos const para indicar el uso de mongoose


const app = express();//creo una variable de tipo express que contendra todo lo que tiene express




/*metodo GET,recibe 2 paramteros (ruta:a la que el servidor va a responder) y una funcion arrow que tiene dos parametros req y res, desde el parametro/funcion REQ el servidor recibe todo lo que el usuario manda o consulta y RES es la respuesta que da el servidor al cliente*/

app.use(express.json());// declaramos que recibiremos dentro del BODY la informacion en formato JASON!

//const para conectar la base de datos con nuestra aplicacion


//URL DE CONEXION A BASE DE DATOS MONGO DB
const uri =  "mongodb+srv://sabrina:<clave>@cluster0.bnlwz.mongodb.net/<mongoName>?retryWrites=true&w=majority";

//CONEXION A MONGOOSE
async function conectar() {
    try{
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log("Conectado a la base de datos metodo: mongoodb - async-await");
    }
    catch(e){
        console.log(e);
    }
};
conectar();



//DEFINICION DE ESQUEMAS - para MONGODB Mongoose

//GENEROS
const GeneroSchema=new mongoose.Schema({
    genero:String,
    borrado:Boolean,    //en caso de futuras modificaciones
    verificacionGenero:String
})

const GeneroModel= mongoose.model("generos", GeneroSchema);


//LIBROS
const LibroSchema= new mongoose.Schema({
    nombre:String,
    autor:String,
    genero:{//relacion entre colecciones
        type:mongoose.Schema.Types.ObjectId, //objectID es el tipo de id que genera el mongo (asi linkeo colecciones)
        ref:"generos"//asi se llama lo que estoy referenciando(desde mi base de datos),voy a guardar en genero el OBJECT ID de algo que esta en la coleccion de generos, va a verificar que el id que ingrese en el campo genero corresponda con el id de la coleccion
    },
    prestado:String,
    verificacion:String,
})

const LibroModel= mongoose.model("libros", LibroSchema);




// uso de metodo CRUD- create(post), read(get), update(put), delete

//API---> /genero    /libro


/*------------METODOS PARA LIBRO--------------------*/

//METODO POST
app.post('/libro', async (req,res)=>{ //conexion a la base de datos (asincronismo)
    try {
        //verificacion de informacion
        let nombre = req.body.nombre;// paso la info recibida a una variable
        let autor = req.body.autor;
        let genero =req.body.genero;
        let prestado = '';//puede estar vacio al principio
        let verificacionLibro = nombre.toLowerCase();
        verificacionLibro = verificacionLibro.replace(/ /g, '');


        //comprobacion de datos
        if (autor == undefined || nombre == undefined || genero == undefined){
            throw new Error('debes cargar todos los campos requeridos');
        }
        if(autor==''|| nombre=='' || genero==''){
            throw new Error('no pueden haber campos vacios');
        }

        let generoExiste = await GeneroModel.findById({_id:genero});
        if(!generoExiste){
            throw new Error("El genero no Existe");
        }
        


        //creo una estructura para enviar a la base de datos
        let libro = {
            nombre:nombre,
            autor:autor,
            genero:genero,
            prestado:prestado,
            verificacion:verificacionLibro,
        }

        //chequeamos que el libro no este cargado
        let libroExiste = await LibroModel.find({verificacion : verificacionLibro});
        console.log('libro existe: ',libroExiste)
        //el find encuentra todos los que cumplen con una condicion-siempre devuelve un array
    
        if(libroExiste.length > 0){//corroboramos si el array esta vacios
            throw new Error(`El libro que intentas cargar ya existe: ${nombre}`);
        }


        //hago el push del libro a la base de datos
        let libroGuardado = await LibroModel.create(libro); //asincronismo aca se debe esperar a conectar!

        console.log(libroGuardado);//esto se vera en el CMD
        res.status(200).send(`libro guardado ${libroGuardado}`);

    } catch (e) {

        res.status(422).send({message:'Algo salio mal - '} + e);

    }
});

//METODO GET GENERAL
app.get('/libro', async(req,res)=>{
    try {
        let listaLibros = await LibroModel.find();
        console.log(listaLibros)

        res.status(200).send(listaLibros);
        
    } catch (e) {
        res.status(422).send({message:'algo salio mal -' + e});
    }
})


//METODO GET especifico
app.get('/libro/:id', async(req,res)=>{

    try {

        let idLibro = req.params.id;
        let libroElegido = await LibroModel.findById(idLibro);
        
        res.status(200).send(libroElegido);
    } catch (e) {
        res.status(422).send({message:'No contamos con ese libro -('+ e +')'});
    }
});


//METODO PUT
app.put('/libro/:id', async(req,res)=>{

    try {
        

        let libroId = req.params.id;
        let persona = req.body.prestado;
        
        if(persona == undefined){
            throw new Error("Debes indicar a quien le prestas el Libro");
        }
       
        let libro = await LibroModel.findById(libroId);
        if(libro.prestado!=""){
                throw new Error("El libro ya esta prestado");
        }else{
        
        let libroAPrestar = {
            prestado:persona
        }

        await LibroModel.findByIdAndUpdate(libroId,libroAPrestar);
       res.status(200).send(`libro prestado a: ${libroAPrestar.prestado}`);
    }
    } catch (e) {
        res.status(422).send({message:'algo salio mal -' + e});
    }

})


//METODO DELETE
app.delete('/libro/:id', async (req,res)=>{

    try {

        let libroId = req.params.id;
        let devuelto= '';
    
        let libro= await LibroModel.findById(libroId);


    if(libroId.prestado =="" || libro.prestado == undefined ){
        throw new Error("El libro Ya esta disponible en tu biblioteca");
    }else{
    
       
        let libroDevuelto = {
            prestado:devuelto
        }
        await LibroModel.findByIdAndUpdate(libroId,libroDevuelto);

       res.status(200).send("libro devuelto ");
    }

        
    } catch (e) {
        res.status(422).send({message:'algo salio mal -' + e});
    }
})



/*---------------------METODOS PARA GENEROS--------------*/


//METODO POST
app.post('/genero', async (req,res)=>{ //conexion a la base de datos (asincronismo)
    try {
        //verificacion de informacion
        let datoGenero= req.body.genero;// paso la info recibida a una variable
        let verificacionDeGenero=datoGenero.toLowerCase();
        verificacionDeGenero=verificacionDeGenero.replace(/ /g, '');
        //let verifGenero=verificacionDeGenero;
        let borrarGenero=false;// genero habilitado por defecto
        

        //COMPROBACION DE DATOS
        if (datoGenero == undefined){
            throw new Error('debes cargar el genero');
        }
        if(datoGenero ==''){
            throw new Error('no pueden haber campos vacios, debes cargar un genero');
        }

        if( borrarGenero== undefined){
            borrarGenero=false;
        }
        if(borrarGenero==''){
            borrarGenero=false;
        }


        //creo una estructura para enviar a la base de datos
        let genero={
            genero:datoGenero.toLowerCase(),
            borrado:borrarGenero, //para posibles modificaciones de listado de generos
            verificacionGenero:verificacionDeGenero
        }


        let generoExiste=null;
        generoExiste = await GeneroModel.find({verificacionGenero:verificacionDeGenero});
        console.log(`genero existe: ${generoExiste}`);
        //el find encuentra todos los que cumplen con una condicion y siempre devuelve un array
    
        if(generoExiste.length > 0){ //corroboramos si el array esta vacio
            throw new Error(`El genero que intentas cargar ya existe: ${generoExiste}`);
        }




        //hago el push del libro a la base de datos
        let generoGuardado = await GeneroModel.create(genero); //asincronismo aca se debe esperar a conectar!

        console.log(generoGuardado);//esto se vera en el CMD
        res.status(200).send( `Nuevo Genero guardado: ${generoGuardado}`);

    } catch (e) {

        res.status(422).send({message:'Error en la carga de genero -' + e});

    }
});


//METODO GET GENERAL
app.get('/genero', async(req,res)=>{
    try {
        let listaGeneros = await GeneroModel.find({borrado:false});
        console.log(listaGeneros)

        res.status(200).send(listaGeneros);
        
    } catch (e) {
        res.status(422).send({message:'algo salio mal -' + e});
    }
})


//METODO GET especifico
app.get('/genero/:id', async(req,res)=>{

    try {

        let idGenero = req.params.id;
        let generoElegido = await GeneroModel.findById(idGenero);

        if(generoElegido.borrado!=false){
            throw new Error("el genero que buscas no existe actualmente");
        }else{
            res.status(200).send(generoElegido);
        }
        
        
    } catch (e) {
        res.status(422).send({message:'algo salio mal -' + e});
    }
});


//Metodo DELETE- borrado logico, el genero no se borra fisicamente, se oculta para el usuario
app.delete('/genero/:id', async(req,res)=>{
    try {
        let borrarGenero=req.params.id;

        if(borrarGenero.borrado == true){
                throw new Error("El genero ya fue borrado");
            }else{    
                let genero={
                    borrado:true
                }
                let generoBorrado=await GeneroModel.findByIdAndUpdate(borrarGenero,genero);
        }


        res.status(200).send('genero borrado correctamente');

        
    } catch (e) {
        res.status(422).send({message:'algo salio mal -' + e});
    }
})


//METODO PUT -ACTUALIZACION DE GENERO
app.put('/genero/:id', async(req,res)=>{
    try {
        let generoId=req.params.id;
        
        if(generoId.borrado != false){
            let genero={
                borrado:false
            }
            let generoReincorporado=await GeneroModel.findByIdAndUpdate(generoId,genero);
            
            res.status(200).send(`genero '${generoReincorporado.genero}, se incorporo correctamente`);

            }else{    
                
                res.status(400).send('Ese genero ya existe');
        }


    } catch (e) {
        res.status(422).send({message:'algo salio mal -' + e});
    }
})



/*************** ESTO SIEMPRE VA AL FINAL ********************/
app.listen(3000, ()=>{
    console.log('servidor escuchando en puerto 3000');
});//designo el puerto para la peticiones externas, los puertos tienen rangos para cada funcion, colocamos tambien una funcion arrow para mostrar desde consola que la app esta funcionando

