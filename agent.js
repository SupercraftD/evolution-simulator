class Agent{
    constructor(x,y,genes){
        this.x = x
        this.y = y
        this.genes = genes
        this.color = [this.genes[0],this.genes[1],this.genes[2]]
        this.inputs = this.genes[3]
        this.inter = this.genes[4]
        this.output = this.genes[5]
        this.flaggedForDeath=false
        this.hasKilled=false
        this.speed=0
    }
    draw(){
        fill(this.color)
        strokeWeight(this.flaggedForDeath ? 3 : 1)
        rect(this.x*ZOOMSCALE,this.y*ZOOMSCALE,1*ZOOMSCALE,1*ZOOMSCALE)
        
        if (paused){return}

        this.inputValues = new Array(this.inter.length)
        for (let input of this.inputs){
            //constant input
            if (input[0]=='c'){
                let exp = input.split('(')[1].split(')')[0]
                let fIn = input.split(')')[1]
                this.inputValues[parseInt(fIn)] = exp
            }else if (input[0]=='r'){
                let exp = input.split('(')[1].split(')')[0].split(',')
                let min=parseFloat(exp[0])
                let max = parseFloat(exp[1])
                let val = random(min,max)
                
                let fIn = input.split(')')[1]
                this.inputValues[parseInt(fIn)] = val.toString()
            }else if (input[0]=='d'){

                let masterDeterminativeTable = {
                    'distanced':()=>{
                        let closest = 9999999
                        for (let agent of agents){
                            if (agent != this){
                                let dist = Math.sqrt(((agent.x-this.x)**2)+((agent.y-this.y)**2))
                                if (dist<closest){
                                    closest=dist
                                }    
                            }
                        }
                        if (closest<2){
                            return 1
                        }
                        return 0
                    },
                    'distanceToPoint':()=>{
                        let px=60
                        let py=30
                        let dist = Math.sqrt(((this.x-px)**2)+((this.y-py)**2))
                        if (dist<30){
                            return 1
                        }
                        return 0
                    },
                    'getTime':()=>{
                        return time
                    }
                }

                let exp = input.split('(')[1].split(')')[0]
                if (exp in masterDeterminativeTable){
                    let val = masterDeterminativeTable[exp]()
                    let fIn = input.split(')')[1]
                    this.inputValues[parseInt(fIn)] = val.toString()
                }
            }
        }
        this.interValues = new Array(this.output.length)
        for (let i=0;i<this.inter.length;i++){
            let inter = this.inter[i]
            let multiplier = 0
            if (inter[0]=='c'){
                let exp = inter.split('(')[1].split(')')[0]
                multiplier = parseFloat(exp)
            }else if (inter[0]=='r'){
                let exp = inter.split('(')[1].split(')')[0].split(',')
                let min = parseFloat(exp[0])
                let max = parseFloat(exp[1])
                let val = random(min,max)
                multiplier = val
            }
            let iVal = parseFloat(this.inputValues[i])
            if (iVal){
                let pVal = iVal*multiplier
                let outputs = inter.split('F:')[1].split(';')
                for (let f of outputs){
                    let fIndex = f.slice(1,f.length)
                    if (f[0]=='i'){
                        let o = this.inputValues[parseInt(fIndex)]
                        if (o){
                            o+=pVal
                        }else{
                            this.inputValues[parseInt(fIndex)] = pVal
                        }
                    }else if (f[0]=='m'){
                        let o = this.interValues[parseInt(fIndex)]
                        if (o){
                            this.interValues[parseInt(fIndex)] += pVal
                        }else{
                            this.interValues[parseInt(fIndex)] = pVal
                        }
                    }
                }
            }
        }
        for (let i=0;i<this.output.length;i++){
            let output=this.output[i]
            let val = this.interValues[i]
            if (val){
                this.mX = this.x
                this.mY = this.y
                switch(output){
                    case 'Me':
                        this.mX += val*globalSpeedScale
                        break
                    case 'Mw':
                        this.mX -= val*globalSpeedScale
                        break
                    case 'Mn':
                        this.mY -= val*globalSpeedScale
                        break
                    case 'Ms':
                        this.mY += val*globalSpeedScale
                        break
                    case 'KILL':
                        if (val==1 && enableKillNeuron){
                            let closestOtherAgent
                            let closest = 9999
                            for (let agent of agents){
                                if (!arraysEqual(agent.color,this.color) || agent.inter[5]!=agent.inter[5]){
                                    let dist = Math.sqrt(((agent.x-this.x)**2)+((agent.y-this.y)**2))
                                    if (dist<closest){
                                        closest=dist
                                        closestOtherAgent = agent
                                    }
                                }
                            }
                            if (closestOtherAgent){
                                if (!this.hasKilled){
                                    closestOtherAgent.flaggedForDeath = true    
                                    this.hasKilled = true
                                }
                            }
                        }
                        break
                }
                this.speed = Math.sqrt(((this.x-this.mX)**2)+((this.y-this.mY)**2))

                for (let agent of agents){
                    if (agent != this){
                        if (collideRectRect(this.mX,this.y,1,1,agent.x,agent.y,1,1)){
                            this.mX = this.x
                        }
                        if (collideRectRect(this.x,this.mY,1,1,agent.x,agent.y,1,1)){
                            this.mY = this.y
                        }
                    }
                }
                if (this.mX<0){this.mX=0}
                if (this.mX+1>WIDTH){this.mX=WIDTH-1}
                if (this.mY<0){this.mY=0}
                if (this.mY+1>HEIGHT){this.mY=HEIGHT-1}
                this.x = this.mX
                this.y = this.mY
            }
        }
    }
}