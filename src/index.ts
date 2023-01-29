import v2 from './v2'
import v3 from './v3'
import v4 from './v4'
import deviceId from './deviceId';
import computeCode from './code';
export { v2, v3, v4, deviceId, computeCode };

export interface Token {
    version: 2 | 3 | 4,
    serial: string,
    digits: number
    intervalInSeconds: 30 | 60,
    expiresAt: Date,
    decryptedSeed: Buffer,
    flags: {
        mode: boolean,
        pinIsRequired: boolean,
        passwordIsRequired: boolean,
        deviceIdIsRequired: boolean,
        usesAppDerivedSeeds: boolean,
        usesTimeDerivedSeeds: boolean,
        keyIs128Bit: boolean
    },
    /**
     * Computes a code for this token
     * @param pin The pin to use to generate the code
     * @param date The instant to generate the token for
     * @returns Object containg code details
     */
    computeCode: (pin?: string | number, date?: Date) => Code
}

export interface Code {
    validFrom: Date,
    expiresAt: Date,
    code: string
}

if(typeof document !== "undefined") {
    const input = document.getElementById("input") as HTMLInputElement;
    const pin = document.getElementById("pin") as HTMLInputElement;
    const remember = document.getElementById("remember") as HTMLInputElement;
    const output = document.getElementById("output") as HTMLInputElement;
    let token : Token | null = null;
    let code : Code | null = null;

    let updateOutput = function() {
        if(token && pin.value.length >= 4 && pin.value.length <= 8) {
            code = token.computeCode(pin.value);
            output.value = code.code;
        } else {
            output.value = "";
        }
    }

    let setToken = function() {
        try {
            token = v4(input.value);
            input.classList.add("valid");
        } catch(e) {
            token = null;
            input.classList.remove("valid");
        }
        
        if(remember.checked)
            localStorage.token = input.value;

        updateOutput();
    }
    
    setInterval(function() {
        if(code && code.expiresAt < new Date()) {
            updateOutput();
        }
    }, 1000);
    
    input.addEventListener("change", setToken);

    pin.addEventListener("change", function() {
        if(pin.value.length >= 4 && pin.value.length <= 8)
            pin.classList.add("valid");
        else
            pin.classList.remove("valid");

        updateOutput();
    });

    remember.addEventListener("change", function() {
        if(remember.checked)
            localStorage.token = input.value;
        else
            delete localStorage.token;
    });

    if(localStorage.token) {
        input.value = localStorage.token;
        setToken();
        remember.checked = true;
    }

}