let canv
let ctx

let paused = false

let time=0

const WIDTH=120
const HEIGHT=60
const ZOOMSCALE=5

let globalSpeedScale = 1

let agentCount=250
let agents=[]

let genLength = 1000
let generation = 0
let mode = 'manual'

let enableKillNeuron=false

document.getElementById('manual').onclick = genModeChange
document.getElementById('auto').onclick = genModeChange

function genModeChange(){
  if (document.getElementById('manual').checked){
    mode = 'manual'
  }else{
    mode='automatic'
    if (!roundTiming){
      manualNewGen()
    }
  }
}


function genRandomGenes(){
  
  let r = random(0,256).toString()
  let g = random(0,256).toString()
  let b = random(0,256).toString()
 

/*   let r = random([0,126,255]).toString()
  let g = r
  let b = r
 */

  let inputs = ['d(distanced)0','c(1)1','c(1)2','c(1)3','c(1)4','c(1)5'/*,'d(distanceToPoint)6','d(getTime)6'*/]
  let inter = ['r(-5,5)F:i1;i2;i3;i4','r(0,1)F:m0','r(0,1)F:m1','r(0,1)F:m2','r(0,1)F:m3','r(0,1)F:m4','r(0,1)F:m0;m1;m2;m3']
  for (let x=0;x<inter.length;x++){
    i=inter[x]
    if (i[0]=='c'){
      let rh = i.split('F:')[1]
      let mp = random([-1,0,1])
      let lh = 'c('+mp.toString()+')'
      let eq = lh+'F:'+rh
      inter[x]=eq
    }else if (i[0]=='r'){
      let rh = i.split('F:')[1]
      let min=0
      let max=0
      min = random([-1,0,1])
      max = min+random([0,1,2])
      let lh= `r(${min},${max})`
      let eq = lh + 'F:' + rh
      inter[x]=eq  
    }
  }
  let outputs = ['Mw','Me','Mn','Ms','KILL']

  let gene = [r,g,b,inputs,inter,outputs]
  return gene
}
let mutationCutoff=75
function mutate(genes){
  if (random(100)>mutationCutoff){
    genes[random([0,1,2])]=random(0,255)
    let type = random(['input','inter'])
    if (type=='input'){
      let inputs = genes[3]
      let mutatedInput=random(inputs)
      if ('dt'.includes(mutatedInput[0])){
        while ('dt'.includes(mutatedInput[0])){
          mutatedInput=random(inputs)
        }
      }
      let idx = mutatedInput[mutatedInput.length-1]
      let itype=random(['c','r'])
      let lh=''
      if (itype=='c'){
        lh='c('+random([-1,0,1]).toString()+')'
      }else if (itype=='r'){
        let min = random([-1,0,1])
        let max = min+random([0,1,2])
        lh= `r(${min},${max})`
      }
      let eq = lh+idx
      inputs[parseInt(idx)]=eq
      genes[3]=inputs
    }else{
      let inters = genes[4]
      let mutatedInter = random(inters)
      let idx = inters.indexOf(mutatedInter)
      let rh = mutatedInter.split('F:')[1]
      let min = random([-1,0,1])
      let max = min+random([0,1,2])
      let lh= `r(${min},${max})`
      let eq = lh + 'F:' + rh
      inters[idx]=eq
      genes[4]=inters
    }
  }
  return genes
}


let roundTimer
let roundTiming = true

function setup(){
  createCanvas(WIDTH*ZOOMSCALE, HEIGHT*ZOOMSCALE)
  for (let i=0;i<agentCount;i++){
    let gene = genRandomGenes()
    agents.push(new Agent(random(0, WIDTH),random(0,WIDTH),gene))
  }
  document.getElementById('manualgen').disabled = true
  roundTimer = setInterval(endRound, genLength);
  roundTiming = true
}
let newAgents = []
let criteriaMet=0


let enforceAgentCount=true


function endRound(){
  time=0
  let colorsMet={}

  criteriaMet=0
  let survivalCriteria = (agent) =>{
    return agent.x>WIDTH-10
  }

  let metAgents = []
  for (let agent of agents){
    if (survivalCriteria(agent)){
      metAgents.push(agent)
      criteriaMet+=1
      if (agent.color in colorsMet){
        colorsMet[agent.color]+=1
      }else{
        colorsMet[agent.color]=1
      }
    }
  }
  const sortable = Object.fromEntries(
    Object.entries(colorsMet).sort(([,a],[,b]) => b-a)
  );
  for (let color in sortable){
    for (let agent of metAgents){
      if (agent.color == color){
        console.log(agent)
        console.log(sortable[color])
        break
      }
    }
    break
  }
  newAgents=[]
  while (newAgents.length < (enforceAgentCount ? agentCount : metAgents.length)){
    for (let agent of metAgents){
      newAgents.push(new Agent(random(0,WIDTH),random(0,HEIGHT),mutate(JSON.parse(JSON.stringify(agent.genes)))))
    }  
  }
  if (mode=='automatic'){
    if (newAgents.length>agentCount){
      newAgents = newAgents.slice(0,agentCount)
    }
    agents = newAgents
    generation += 1
  }else{
    document.getElementById('manualgen').disabled = false
    clearInterval(roundTimer)
    roundTiming = false
  }
}

function manualNewGen(){
  document.getElementById('manualgen').disabled = true
  if (newAgents.length>agentCount){
    newAgents = newAgents.slice(0,agentCount)
  }

  agents = newAgents
  generation += 1
  roundTimer = setInterval(endRound,genLength)
  roundTiming = true
}

function reset(){
  generation=0
  agents=[]
  for (let i=0;i<agentCount;i++){
    let gene = genRandomGenes()
    agents.push(new Agent(random(0, WIDTH),random(0,HEIGHT),gene))
  }
}

function draw(){
  time += 0.5
  document.getElementById('gen').innerHTML = 'Generation: '+generation.toString()
  document.getElementById('agentcount').innerHTML = 'Agent Count: '+agents.length.toString()
  document.getElementById('criteriamet').innerHTML = 'Criteria Met: '+criteriaMet.toString()
  if (paused){
    document.getElementById('paused').style.display = 'block'
  }else{
    document.getElementById('paused').style.display = 'none'
  }
  background(255)
  for(let agent of agents){
    agent.draw()
  }
}

function mouseClicked(){
  for (let agent of agents){
    if (collidePointRect(mouseX,mouseY,agent.x*ZOOMSCALE,agent.y*ZOOMSCALE,ZOOMSCALE,ZOOMSCALE)){
      console.log(agent)
    }
  }
}

function keyPressed(){
  if (key==' '){
    paused = !paused
    if (paused){ clearInterval(roundTimer); roundTiming=false}
    else{ roundTimer=setInterval(endRound,genLength);roundTiming=true}
  }
}