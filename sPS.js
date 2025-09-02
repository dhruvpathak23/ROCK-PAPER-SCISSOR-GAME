let userScore = 0;
let AIscore = 0;

const choices = document.querySelectorAll(".choice");
const msg = document.querySelector("#msg");
const userScorePara = document.querySelector("#user-score");
const compScorePara = document.querySelector("#AI-score");
const genCompChoice = () =>{
const options = ["rock","paper","scissors"];
const randIdx = Math.floor(Math.random() * 3);
return options[randIdx];
 
};
const drawGame = () => {
    
    msg.innerText = "this time fate chooses no-one , it's a DRAW !!";
    msg.style.backgroundColor = "yellow";
};
const showWinner = (userWin,userChoice,compChoice) => {
    if (userWin) {
        userScore++;
        userScorePara.innerText = userScore;
        msg.innerText = `you Crushed me this time !...${userChoice} beats ${compChoice} `;
        msg.style.backgroundColor = "Green";
    } else {
        AIscore++;
        compScorePara.innerText = AIscore;
        msg.innerText = `not this time , it's AI on this side!...${compChoice} beats ${userChoice}`;
        msg.style.backgroundColor = "Red";
    }
};
const playGame = (userChoice) => {
    
    //gen. comp. choice
    const compChoice = genCompChoice();

    if(userChoice == compChoice) {
        //Draw game 
        drawGame();
    } else {
        let userWin = true;
        if (userChoice === "rock"){
            //scissors , paper
            userWin = compChoice === "paper" ? false : true;
        }else if (userChoice === "paper"){
            //scissors , rock
            userWin = compChoice === "scissors" ? false : true;
        } else  {
            //rock , paper
            userWin = compChoice === "rock" ? false : true;
        }
        showWinner(userWin,userChoice,compChoice);
    }
};
choices.forEach((choice) => {
     
choice.addEventListener("click", () => {
    const userChoice = choice.getAttribute("id");
    playGame(userChoice);
});
});
