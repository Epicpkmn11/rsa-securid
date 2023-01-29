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
    const devId = document.getElementById("devid") as HTMLInputElement;
    const devIdDiv = document.getElementById("devid-div") as HTMLElement;
    const password = document.getElementById("password") as HTMLInputElement;
    const passwordDiv = document.getElementById("password-div") as HTMLElement;
    const version = document.getElementById("version") as HTMLOptionElement;
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
        // Token
        try {
            switch(version.value) {
                case "2":
                    token = v2(input.value, password.value, devId.value);
                    break;
                case "3":
                    token = v3(input.value, password.value, devId.value);
                    break;
                case "4":
                default:
                    token = v4(input.value, password.value, devId.value);
                    break;
            }
            input.classList.add("valid");
            devId.classList.add("valid");
            password.classList.add("valid");

            if(token.flags.deviceIdIsRequired)
                devIdDiv.classList.remove("hidden");
            else
                devIdDiv.classList.add("hidden");

            if(token.flags.passwordIsRequired)
                passwordDiv.classList.remove("hidden");
            else
                passwordDiv.classList.add("hidden");
        } catch(e) {
            console.log("Error loading token", e);
            token = null;
            input.classList.remove("valid");
            if(e.message.includes("devid_hash") || e.message.includes("device ID of length")) {
                devId.classList.remove("valid");
                devIdDiv.classList.remove("hidden");
            }
            if(e.message.includes("pass_hash") || e.message.includes("decryptedSeedHash")) {
                password.classList.remove("valid");
                passwordDiv.classList.remove("hidden");
            }

            if(e.message == "Missing deviceId")
                devIdDiv.classList.remove("hidden");
            if(e.message == "Missing password")
                passwordDiv.classList.remove("hidden");
                
            if(e.message == "Token too short") {
                devIdDiv.classList.add("hidden");
                passwordDiv.classList.add("hidden");
            }
        }

        // PIN
        if(pin.value.match(/^\d{4,8}$/))
            pin.classList.add("valid");
        else
            pin.classList.remove("valid");

        if(remember.checked) {
            localStorage.token = input.value;
            localStorage.devId = devId.value;
            localStorage.password = password.value;
            localStorage.version = version.value;
        }

        updateOutput();
    }
    
    setInterval(function() {
        if(code && code.expiresAt < new Date()) {
            updateOutput();
        }
    }, 1000);
    
    input.addEventListener("change", setToken);
    devId.addEventListener("change", setToken);
    password.addEventListener("change", setToken);
    version.addEventListener("change", setToken);
    pin.addEventListener("change", setToken);

    remember.addEventListener("change", function() {
        if(remember.checked) {
            localStorage.token = input.value;
            localStorage.devId = devId.value;
            localStorage.password = password.value;
            localStorage.version = version.value;
        } else {
            delete localStorage.token;
            delete localStorage.devId;
            delete localStorage.password;
            delete localStorage.version;
        }
    });

    let searchParams = new URLSearchParams(window.location.search);
    if(searchParams.has("token")) {
        input.value = searchParams.get("token") as string;
        setToken();

        searchParams.delete("token");
        let searchStr = searchParams.toString();
        if(searchStr.length > 0)
            searchStr = "?" + searchStr;
        window.history.replaceState(null, "", window.location.pathname + searchStr + window.location.hash);
    } else if(localStorage.token) {
        input.value = localStorage.token;
        if(localStorage.devId)
            devId.value = localStorage.devId;
        if(localStorage.password)
            password.value = localStorage.password;
        if(localStorage.version)
            version.value = localStorage.version;
        setToken();
        remember.checked = true;
    }
}