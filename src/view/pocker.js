import { useState,useCallback} from "react";
import {Container,Row,Col,Button,Form, Stack} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

function Pocker(){
const [player,setPlayer]=useState([])
const [newplayer,setNewplayer]=useState({name:""})
const [data,setData]=useState({big:{id:1,name:""},small:{id:2,name:""},currentPlayer:{id:2,name:""}})
const [tempData,setTempData]=useState([])
const [nocurrent,setNocurrent]=useState(0)
const [maxPoint,setMax]=useState(100)
const [IncreasePoint,setIncreasePoint]=useState(100)
const[tick,setTick]=useState([])
const [start,setStart]=useState('true')

const UpdateTempData=(Ids)=>{                                         // update tempary points of one  round
  
  setTempData(()=>{
    let temp=[]
    player.forEach(function(value){
      if(value.id===Ids.big.id){
        temp.push({id:value.id,name:value.name,point:100,history:[100],check:true})
      }
      else if(value.id===Ids.small.id){
        temp.push({id:value.id,name:value.name,point:50,history:[],check:true})
      }
      else{
        temp.push({id:value.id,name:value.name,point:0,history:[],check:true})
      }
     
    })
   // console.log(temp)
    return temp;
  })
}

 async function getNo_winner(){                                 // find no of winers of one rounds 
  let pp=0;
  tick.forEach((value)=>{ 
    if(value===1){
     pp++;}
    else{}})
    return pp;
}
const get_prize=(No_winner)=>{                                //total prize in the game
    let pp={No_winner:No_winner,prize:0}
    tempData.forEach((value)=>{pp.prize+=value.point})
    return pp 
}
const Update_prize=(data)=>{
  let temp=player;
  
  tick.forEach((value,index)=>{
    if(value===1){
  
     temp[index].data.point+=parseInt(data.prize/data.No_winner)-tempData[index].point
    }
    else{
      if( temp[index].data.point-tempData[index].point<=0){ setNocurrent((old)=>old-1); temp[index].check=false }
      temp[index].data.point-=tempData[index].point
    }
   
  
})
return temp
}

const Get_big=(GPlayer)=>{
  let k 
     k=data.big.id+1
     if(k>player.length){k=1}
  
      while(GPlayer[k-1].check===false){k++;
      if(k>player.length){k=1}}
      return {big:{id:k,name:player[k-1].name}} 
}
const Get_small=(GPlayer)=>{
  let k
      k=data.small.id+1
     if(k>player.length){k=1}
  
      while(GPlayer[k-1].check===false){k++;
      if(k>player.length){k=1}}
      return {small:{id:k,name:player[k-1].name}}
}
const Get_currentPlayer=(GPlayer)=>{
  let k
      k=data.small.id+1
     if(k>player.length){k=1}
  
      while(player[k-1].check===false){k++;
      if(k>player.length){k=1}}
      return {currentPlayer:{id:k,name:player[k-1].name}}
}

const Update_big=useCallback((Gdata)=>{
  setData((old)=>{
      return {...old,big:Gdata.big}
    }) 
},[])

const Update_small=useCallback((Gdata)=>{
   setData((old)=>{ return {...old,small:Gdata.small} })
},[])
const Update_currentPlayer=useCallback((Gdata)=>{
  setData((old)=>{ return {...old,currentPlayer:Gdata.currentPlayer} })
},[])



const Done =()=>{
  // console.log(tick)
  // console.log(player)
  // console.log(tempData)
  getNo_winner().then(get_prize).then(Update_prize).then((temp)=>{ 
    // console.log(temp)
     setPlayer(()=>temp)
     let small=Get_small(temp)
     let big=Get_big(temp)
     let current=Get_currentPlayer()
     Update_big(big)
     Update_small(small)
     Update_currentPlayer(current)
     UpdateTempData({big:big.big,small:small.small})
     setMax(()=>100)
   })
 }

const check =(id,event)=>{
  setTick((old)=>{
    let temp=JSON.parse(JSON.stringify(old));
    temp.forEach((value,index)=>{
      if(index===id-1){
       // console.log(event.target.checked)
        if(event.target.checked===true){
        temp[index]=1;}
       
        else{     temp[index]=0;} 
      }
    })
     
    return temp;
   
   })
}



const Holdtempdata=useCallback((data)=>{
  
  setTempData((old)=>{
    var newarr=old;
   old.forEach((value)=>{
    if(value.id===data.currentPlayer.id){
      newarr[value.id-1].check=false
      if(newarr[value.id-1].history.length===0){newarr[value.id-1].history.push(newarr[value.id-1].point)
        // 
      }
      else{ 
        if(newarr[value.id-1].history[newarr[value.id-1].history.length-1]>newarr[value.id-1].point){ 
          newarr[value.id-1].point=newarr[value.id-1].history[newarr[value.id-1].history.length-1]}
        else if(newarr[value.id-1].history[newarr[value.id-1].history.length-1]<newarr[value.id-1].point){ newarr[value.id-1].history.push(newarr[value.id-1].point)}
      }
      } })
  
   
    return newarr
  })
  
},[])

useCallback(()=>{ setData((old)=>old)},[tempData])

const Calltempdata=(data,maxPoint,event)=>{
  
  
  setTempData((old)=>{
    let newarr=JSON.parse(JSON.stringify(old));
   old.forEach((value)=>{
    if(value.id===data.currentPlayer.id){
     
      newarr[value.id-1].history.push(maxPoint)
      newarr[value.id-1].point=maxPoint
      } })
  
   
    return newarr
  })
  
}


const Update_player=useCallback((tempData,player)=>{
  setData((old)=>{
     var k=old.currentPlayer.id+1
     if(k>player.length){k=1}
  
      while(tempData[k-1].check===false||player[k-1].check===false){k++;
      if(k>player.length){k=1}}
      return {...old,currentPlayer:{id:k,name:player[k-1].name}}
    })
  

},[])

const Hold=(data,no,tempData,player,event)=>{
  Holdtempdata(data,no,tempData,player,event)
  Update_player(tempData,player)
  
}
const Call= (data,no,tempData,player,event)=>{
  Calltempdata(data,maxPoint,event)
  Update_player(tempData,player)
}
const Shaw=  (data,no,tempData,player,event)=>{
  Calltempdata(data,maxPoint,event)
  Update_player(tempData,player)
}
const setIncrease = async(IncreasePoint)=>{
  return maxPoint+Number(IncreasePoint)
}
const Increase= (data,no,tempData,player,IncreasePoint,event)=>{
  event.preventDefault();
  event.stopPropagation();

  setIncrease(IncreasePoint).then((maxPoint)=>{
    if(maxPoint<=player[data.currentPlayer.id-1].data.point){
    setMax((old)=>old+Number(IncreasePoint));
    Calltempdata(data,maxPoint,event)
    Update_player(tempData,player)}})
    
  
}

const intialTempData=()=>{
  // console.log(data)
  setTempData(()=>{
    let temp=[]
    player.forEach(function(value){
      if(value.id===data.big.id){
        temp.push({id:value.id,name:value.name,point:100,history:[100],check:true})
      }
      else if(value.id===data.small.id){
        temp.push({id:value.id,name:value.name,point:50,history:[],check:true})
      }
      else{
        temp.push({id:value.id,name:value.name,point:0,history:[],check:true})
      }
     
    })
   // console.log(temp)
    return temp;
  })
}

const Addplayer = (value)=>{
  const t=value.target.value
  //  console.log(newplayer)
   setNewplayer((old)=>{return {...old,name:t}})}
 

const IntialData=(old,newplayer)=>{
 
return {
  id:old.length+1,
  name:newplayer.name,
  check:true,
  data:{point:2000,pointHistory:[],tempPoint:0,tempPointHistory:[],}}
}




const handleSubmit = (event,IntialData) => {
  
  event.preventDefault();
  event.stopPropagation();
  setPlayer((old)=>[...old,IntialData(old,newplayer)])
  setNocurrent((old)=>old+1);
  setTick((old)=>{
    let temp=JSON.parse(JSON.stringify(old));
   temp.push(0)
   return temp
 })
//  console.log(newplayer.name)
}
// useCallback()


const IntialGame=useCallback((event,player,intialTempData)=>{
  event.preventDefault();
  event.stopPropagation();
  setData((old)=>{return {...old,big:{id:1,name:player[0].name,tempoint:0},small:{id:2,name:player[1].name,tempoint:0},currentPlayer:{id:2,name:player[1].name,tempoint:0}}})
   intialTempData();
  setStart(()=>'')
  setNocurrent(()=>player.length) 
   
},[])

function ActivePlayer(check){
  if(check){return {color:"blue"}}
  else{return {color:"red"} }
}



const Addpoint=(value)=>{
  setIncreasePoint(()=>value.target.value)
  // console.log(tick)
}
// const AddNewPlayer2=useCallback(()=>{
//   return newplayer.name
// },[newplayer])

const AddNewPlayer =useCallback( ( prop)=>{if(start==='true'){
 return (<Form onSubmit={(event)=>{prop.handleSubmit(event,IntialData)}} >
 <Stack direction="horizontal" gap="2">
 <Form.Label>Name</Form.Label>
 <Form.Text className="text-muted">
      Add atleast two player
 </Form.Text></Stack>
 <Form.Group  controlId="formname"></Form.Group>
 <Stack direction="horizontal" gap="3">
 
 <Form.Control className="me-auto" type="name"  onChange={(event)=>prop.Addplayer(event)} />
 
 
 <Button variant="primary" type="submit">
 Submit
 </Button></Stack>
 </Form>)
}},[start])



return(<>

<Container>
  
    <Row className="md">
    <Col md="5" >
      <Row className="md"><Button variant="danger" disabled={!start} onClick={(event)=>{IntialGame(event,player,intialTempData)}}>Game Start</Button></Row>
      <Row className="md">{<AddNewPlayer handleSubmit={handleSubmit} Addplayer={Addplayer}/> }</Row>
      
      <Row><Col  >Name</Col> <Col  >Points</Col></Row>
      
      
       {
        player.map((value)=><Row className="md border bg-light" ><Col   style={ActivePlayer(value.check)}>{value.name}</Col> <Col >{value.data.point}</Col></Row>)
        }
    
    </Col>
    <Col md="1"></Col>
    <Col md="6" >
    <Row className="md"><Button variant="dark" onClick={(event)=>{Done(data,nocurrent,tempData,player,event)}}>Done</Button></Row>

      <h3>Current Player: {data.currentPlayer.name}</h3>
      <p>Big: {data.big.name}</p>
      <p>Small: {data.small.name}</p>
      
      
        <Stack direction="Vertical" gap="2">
        <Stack direction="horizontal" gap="4">
        <Button variant="primary" onClick={(event)=>{Hold(data,nocurrent,tempData,player,event)}}>Hold</Button>
        <Button variant="primary" onClick={(event)=>{Call(data,nocurrent,tempData,player,event)}}>Call</Button>
        <Button variant="primary" onClick={(event)=>{Shaw(data,nocurrent,tempData,player,event)}}>Show</Button>
        </Stack>
        
        <Form onSubmit={(event)=>{Increase(data,nocurrent,tempData,player,IncreasePoint,event)}} >
        <Stack  direction="horizontal" gap="1">
         <Button variant="primary" type="submit"> Increase</Button>
        <Form.Group  controlId="formname">
         
         <Form.Control type="name" value={IncreasePoint} onChange={Addpoint} />
         
        </Form.Group>
        </Stack>
      </Form>
     
       
    <Container>
      {tempData.map((value)=>{
        
        if(player[value.id-1].check===true){
        return(
          <Row  className="border">
            <Col md={{span:4,offset:0}}>
              <Row>
            <Stack direction="horizontal" gap="2">
            <Col md={{span:1,offset:0}}>
            <Form.Check 
            type={"checkbox"}
            id={`default-checkbox}`}
            onChange={(event)=>{check(value.id,event)}}
             />
             </Col>
             <Col md={{span:2,offset:1}}>
              <span style={ActivePlayer(value.check)}>{value.name}</span>
              </Col>
              </Stack>
              </Row>
              </Col>
            {value.history.map((history1)=>
              <Col  >{history1}</Col>
           )}
          </Row>
        )}
        else{ return  }
      })}
      </Container>
      </Stack>
    </Col>

    

    </Row>
    
   
    
   
</Container>
</>);
}
export default Pocker