const joi=require('joi');
const express=require('express');
const _=require('underscore');
const bodyParser=require('body-parser');
const mongoose = require('mongoose');

const app=express();

app.set('view engine','pug');
app.set('views','./views');

app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


mongoose.connect('mongodb://localhost/playground')
	.then(()=>console.log('connected to MongoDB...'))
	.catch(err => console.error('could not connect to MongoDB...',err));

const subjectSchema = new mongoose.Schema({ 
	Question: String,
	Option_A: String,
	Option_B: String,
	Option_C: String,
	Option_D: String,
	Gate_Year: String,
	Answer: String,
	Topic: String,
	Marks: String
});

const AllsubjectSchema = new mongoose.Schema({ 
	subject:String,
	description:String,
	topics:[{topic:String,desc:String}]
});

const subjects=[
	"COMPUTER NETWORK",
    "DATABASE",
    "DATA STRUCTURE",
    "MATHEMATICS",
    "DIGITAL LOGIC",
    "COMPUTER ARCHITECTURE",
    "OPERATING SYSTEM",
   	"ALGORITHMS",
    "THEORY OF COMPUTATION",
    "COMPILER DESIGN"
];


app.get('/',function(req,res){
	res.render('index',{title:'Project',subjects:subjects});
});
app.get('/about',function(req,res){
	res.render('about',{subjects:subjects});
});
app.get('/subjects',function(req,res){
	res.render('subjects',{subjects:subjects});
});


app.get('/subjects/:subject',function(req,res){

	const subject = req.params.subject;

	async function gettopics(){

		//const Sub = mongoose.model("Allsubject",AllsubjectSchema,"Allsubject");

		let Sub;
		try {
			Sub = mongoose.model("Allsubject");
		} catch (error) {
			Sub = mongoose.model("Allsubject",AllsubjectSchema,"Allsubject");
		}

		const info= await Sub.find({'subject':subject});

		// const Sub = mongoose.model(subject,subjectSchema,subject);
		// const topics= await Sub
		// 	.distinct("Topic");
		console.log(info);
		res.render('subject',{subjects:subjects,subjectInfo:info[0]});
	}

	gettopics();

});

app.get('/subjects/:subject/:topic/questions',function(req,res){

	const subject = req.params.subject;
	const topic = req.params.topic;
	//console.log(subject+topic);

	async function getCourses(){

		const Sub = mongoose.model(subject,subjectSchema,subject);

		// let Sub;
		// try {
		// 	Sub = mongoose.model(subject);
		// } catch (error) {
		// 	Sub = mongoose.model(subject,subjectSchema,subject);
		// }

		const questions= await Sub
			.find({'Topic':topic});
		
		res.render('questions',{subject:subject,subjects:subjects,topic:topic,questions});
	}

	getCourses();

});

app.get('/custom_test',function(req,res){

	async function getAll(){

		//const Sub = mongoose.model("Allsubject",AllsubjectSchema,"Allsubject");

		let Sub;
		try {
			Sub = mongoose.model("Allsubject");
		} catch (error) {
			Sub = mongoose.model("Allsubject",AllsubjectSchema,"Allsubject");
		}

		const info= await Sub.find();
		
		res.render('topicwise',{subjects:subjects,allsub:info});
	}
	getAll();

});

app.post('/custom_test',function(req,res){

	async function getquestion(){

		var que = [];
		var i =0, m = 0, j=0;

		for( i = 0 ; i < req.body.subject.length ; i++) {

			//const Sub = mongoose.model(req.body.subject[i],AllsubjectSchema,req.body.subject[i]);

			let Sub;
			try {
				Sub = mongoose.model(req.body.subject[i]);
			} catch (error) {
				Sub = mongoose.model(req.body.subject[i],AllsubjectSchema,req.body.subject[i]);
			}

		    if(req.body.oneM[i] != 0){
				const info= await Sub.aggregate([{ $match : { Topic : req.body.topic[i] , Marks:"1" } },{ $sample: { size: parseInt(req.body.oneM[i]) } }]);
		        for(j=0;j<info.length;j++){
		        	que[m] = info[j];
		        	m++;
		        }
		    }
		    if(req.body.twoM[i] != 0){
		        const info= await Sub.aggregate([{ $match : { Topic : req.body.topic[i] , Marks:"2" } },{ $sample: { size: parseInt(req.body.twoM[i]) } }]);
		        for(j=0;j<info.length;j++){
		        	que[m] = info[j];
		        	m++;
		        }
		    } 
		}
	  
	  
		// q.all(que).then(function(bothA_and_B) {
		// 	var merged = [].concat.apply([],bothA_and_B );
		// 	res.render("onlineQuestion.ejs" , {allsub:subjects ,allquestion : merged , hr :req.body.hour , min : req.body.minute , sec :req.body.second }); 
		// });

		res.render('online_questions',{subjects:subjects,allquestion:que,hr:req.body.hour,min:req.body.minute,sec:req.body.second});
		
	}
	getquestion();	

});

app.get('/subjectwise_test',function(req,res){

	res.render('subjectwise',{subjects:subjects});

});

app.post('/subjectwise_test',function(req,res){

	async function getquestions(){

		//console.log(req.body.subject);
		var subject=req.body.subject;
		var que = [];
		var i =0, m = 0, j=0, k=0;

		//const Sub = mongoose.model(subject,subjectSchema,subject);

		let Sub;
		try {
			Sub = mongoose.model(subject);
		} catch (error) {
			Sub = mongoose.model(subject,AllsubjectSchema,subject);
		}

		const topic= await Sub.distinct("Topic");
		console.log(subject+topic);

		var len=topic.length;

		//for one mark questions
		var oneM=parseInt(30/len);
		var oneR=30%len;
		//console.log(len+" "+oneM+" "+oneR);

		var extra=1;
		for(j=0;j<len;j++){
			oneR--;
			const info= await Sub.aggregate([{ $match : { Topic : topic[j], Marks:"1" } },{ $sample: { size: oneM+extra } }]);
			if(oneR==0)
				extra=0;
			for(k=0;k<info.length;k++){
	        	que[m] = info[k];
	        	m++;
	        }
		}

        //for two mark questions
        var twoM=parseInt(35/len);
		var twoR=35%len;
		//console.log(len+" "+twoM+" "+twoR);

		extra=1;
		for(j=0;j<len-1;j++){
			twoR--;
			const info= await Sub.aggregate([{ $match : { Topic : topic[j], Marks:"2" } },{ $sample: { size: twoM+extra } }]);
			if(twoR==0)
				extra=0;
			for(k=0;k<info.length;k++){
	        	que[m] = info[k];
	        	m++;
	        }
		}

		res.render('online_questions',{subjects:subjects,allquestion:que,hr:"3",min:"0",sec:"0"});	
	}
	getquestions();	

	

});

app.get('/full_test',function(req,res){

	async function getquestions(){

		//console.log(req.body.subject);
		var subject = subjects[Math.floor(Math.random()*subjects.length)];
		//var subject="COMPILER DESIGN";
		var que = [];
		var i =0, m = 0, j=0, k=0;

		//const Sub = mongoose.model(subject,subjectSchema,subject);

		let Sub;
		try {
			Sub = mongoose.model(subject);
		} catch (error) {
			Sub = mongoose.model(subject,AllsubjectSchema,subject);
		}

		const topic= await Sub.distinct("Topic");
		console.log(subject+topic);

		var len=topic.length;

		//for one mark questions
		var oneM=parseInt(30/len);
		var oneR=30%len;
		//console.log(len+" "+oneM+" "+oneR);

		var extra=1;
		for(j=0;j<len;j++){
			oneR--;
			const info= await Sub.aggregate([{ $match : { Topic : topic[j], Marks:"1" } },{ $sample: { size: oneM+extra } }]);
			if(oneR==0)
				extra=0;
			for(k=0;k<info.length;k++){
	        	que[m] = info[k];
	        	m++;
	        }
		}

        //for two mark questions
        var twoM=parseInt(35/len);
		var twoR=35%len;
		//console.log(len+" "+twoM+" "+twoR);

		extra=1;
		for(j=0;j<len-1;j++){
			twoR--;
			const info= await Sub.aggregate([{ $match : { Topic : topic[j], Marks:"2" } },{ $sample: { size: twoM+extra } }]);
			if(twoR==0)
				extra=0;
			for(k=0;k<info.length;k++){
	        	que[m] = info[k];
	        	m++;
	        }
		}

		res.render('online_questions',{subjects:subjects,allquestion:que,hr:"3",min:"0",sec:"0"});	
	}
	getquestions();	

	

});

// app.get('/test',function(req,res){
// 	res.render('test-form',{title:"Add Data"});
// });

// app.post('/test',function(req,res){
// 	if(!req.body.check)
// 		res.send("off");
// 	else
// 		res.send(req.body.check);
// });


const port=process.env.PORT||3000;
app.listen(port,function(){
	console.log("listening at port "+port+"...");  
});