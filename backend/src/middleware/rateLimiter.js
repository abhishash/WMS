

export const rateLimiter = ({limit = 100, windows = 60000}) =>{
    if(!Number.isSafeInteger(limit) || linit <= 0){
        throw new Error("Rate LImit must be a positive NUmber");
    }

    if(!Number.isSafeInteger(windows) || windows <= 0){
        throw new Error("Windows must be a positive NUmber");
    }

    // key => {count, resetAt}
    let current = new Map();

    const cleanUpTimer = () => {
        
    }



}