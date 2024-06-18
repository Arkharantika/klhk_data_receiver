const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const multer = require("multer");
const { Sequelize, Model, DataTypes } = require("sequelize");

// >>> INITIATION
const app = express();
const port = 7000;
const secretKey = "23Tat0n4sSPASTkn";

// >>> DATABASE MODELS
const sequelize = new Sequelize("nitip_klhk", "sagitarius", "admin123", {
  dialect: "mysql", // or any other dialect
  host: "localhost",
  timezone: "+07:00",
});

const MyModel_rawH = sequelize.define(
  "MyModel_rawH",
  {
    parameter: {
      type: DataTypes.STRING,
    },
    sender: {
      type: DataTypes.STRING,
    },
    browser: {
      type: DataTypes.TEXT,
    },
    kd_logger: {
      type: DataTypes.INTEGER,
    },
    kd_hardware: {
      type: DataTypes.STRING,
    },
    timestamp: {
      type: DataTypes.STRING,
    },
    tlocal: {
      type: DataTypes.DATE,
    },
    latitude: {
      type: DataTypes.DOUBLE,
    },
    longitude: {
      type: DataTypes.DOUBLE,
    },
    buka_pintu: {
      type: DataTypes.INTEGER,
    },
    tzone: {
      type: DataTypes.DOUBLE,
    },
    tsample: {
      type: DataTypes.DOUBLE,
    },
    uid: {
      type: DataTypes.STRING,
    },
  },
  { tableName: "trs_raw_h" }
);

const MyModel_rawGPA = sequelize.define(
  "MyModel_rawGPA",
  {
    tlocal: {
      type: DataTypes.DATE,
    },
    kd_hardware: {
      type: DataTypes.STRING,
    },
    kd_sensor: {
      type: DataTypes.STRING,
    },
    value: {
      type: DataTypes.DOUBLE,
    },
    value_aktual_or_sample: {
      type: DataTypes.DOUBLE,
    },
    level0: {
      type: DataTypes.DOUBLE,
    },
    level1: {
      type: DataTypes.DOUBLE,
    },
    level2: {
      type: DataTypes.DOUBLE,
    },
    level3: {
      type: DataTypes.DOUBLE,
    },
    level4: {
      type: DataTypes.DOUBLE,
    },
    alarm_status: {
      type: DataTypes.INTEGER,
    },
    alarm_setting: {
      type: DataTypes.INTEGER,
    },
  },
  { tableName: "trs_raw_d_gpa" }
);

const MyModel_mstHardware = sequelize.define(
  "MyModel_mstHardware",
  {
    kd_hardware: {
      type: DataTypes.STRING,
    },
    kd_logger: {
      type: DataTypes.INTEGER,
    },
    tlocal: {
      type: DataTypes.DATE,
    },
    tzone: {
      type: DataTypes.DOUBLE,
    },
    tsample: {
      type: DataTypes.DOUBLE,
    },
    condition: {
      type: DataTypes.INTEGER,
    },
    latitude: {
      type: DataTypes.DOUBLE,
    },
    longitude: {
      type: DataTypes.DOUBLE,
    },
    location: {
      type: DataTypes.STRING,
    },
    uid: {
      type: DataTypes.STRING,
    },
    buka_pintu: {
      type: DataTypes.INTEGER,
    },
    sed_conversion: {
      type: DataTypes.DOUBLE,
    },
    sed_catchment_area: {
      type: DataTypes.DOUBLE,
    },
    k1: {
      type: DataTypes.DOUBLE,
    },
    k2: {
      type: DataTypes.DOUBLE,
    },
    k3: {
      type: DataTypes.DOUBLE,
    },
  },
  { tableName: "mst_hardware" }
);

const MyModel_allData = sequelize.define(
  "MyModel_allData",
  {
    kd_hardware: {
      type: DataTypes.STRING,
    },
    tlocal: {
      type: DataTypes.DATE,
    },
    waterlevel: {
      type: DataTypes.DOUBLE,
    },
    debit: {
      type: DataTypes.DOUBLE,
    },
    tss: {
      type: DataTypes.DOUBLE,
    },
    device_temp: {
      type: DataTypes.DOUBLE,
    },
    rainfall: {
      type: DataTypes.DOUBLE,
    },
    battery: {
      type: DataTypes.DOUBLE,
    },
    sedimentasi: {
      type: DataTypes.DOUBLE,
    },
  },
  { tableName: "all_data" }
);

// >>> DB CONNECTION AND SYNC
try {
  async () => {
    await sequelize.authenticate();
    await MyModel_rawH.sync();
    await MyModel_rawGPA.sync();
    await MyModel_mstHardware.sync();
    await MyModel_allData.sync();
  };
  console.log("Database Connected !");
} catch (error) {
  console.log(error);
}

// >>> PARSING BODY FORM
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const upload = multer(); // USE MULTER FOR BODY FORM REQEUST

// >>> TEST ROUTE
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// >>> KEY ROUTE
app.get("/rec/key", (req, res) => {
  res.send("23Tat0n4sSPASTkn");
});

// >>> METHOD TO HANDLE BOTH HEADER/HEADERLESS DATA
app.use((req, res, next) => {
  if (req.method === 'POST') {
      let body = '';

      req.on('data', chunk => {
          body += chunk.toString();
      });

      req.on('end', () => {
          req.rawBody = body;
          try {
              req.body = JSON.parse(body);
          } catch (e) {
              req.body = body; // Fallback to raw text
          }
          next();
      });
  } else {
      next();
  }
});

// >>> POST ROUTE
app.post("/rec/send", (req, res) => {
  const token = req.body.token;
  const trest = req.body;
  console.log(token);
  console.log("trest : ", trest);
  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      return res.send(err);
    }

    const data = decoded;
    const ip = req.ip.replace(/^.*:/, ""); // FOR STANDART IPV4
    const userAgent = req.get("user-agent");
    const dataConverted = JSON.stringify(data);
    var dynamicData = JSON.parse(dataConverted);

    // DELETE UNNECESSARY DATA FOR SENSOR ITERATION
    delete dynamicData.logger;
    delete dynamicData.device;
    delete dynamicData.tlocal;
    delete dynamicData.tzone;
    delete dynamicData.tsample;
    delete dynamicData.status;
    delete dynamicData.latitude;
    delete dynamicData.longitude;
    delete dynamicData.location;
    delete dynamicData.uid;
    delete dynamicData.datetime;
    delete dynamicData.pintu;

    console.log("data : ", data);
    console.log(ip, userAgent);

    try {
      const check = await MyModel_mstHardware.findOne({
        where: {
          kd_hardware: data.device,
        },
      });
      if (!check) {
        await MyModel_mstHardware.create({
          kd_hardware: data.device,
          kd_logger: data.logger,
          uid: data.uid,
          tlocal: data.tlocal,
          tzone: data.tzone,
          tsample: data.tsample,
          latitude: data.latitude,
          longitude: data.longitude,
          location: data.location,
          buka_pintu: data.pintu,
          condition: data.status,
        });
        return res.send("New Loggger Created!");
      }

      const fk = check.sed_conversion;
      const ca = check.sed_catchment_area;
      const k1 = check.k1;
      const k2 = check.k2;
      const k3 = check.k3;

      await MyModel_rawH.create({
        parameter: dataConverted,
        sender: ip,
        browser: userAgent,
        kd_logger: data.logger,
        kd_hardware: data.device,
        tlocal: data.tlocal,
        tzone: data.tzone,
        tsample: data.tsample,
        latitude: data.latitude,
        longitude: data.longitude,
        buka_pintu: data.pintu,
        uid: data.uid,
        timestamp: data.tsample,
      });

      // let debit = 0;
      if (dynamicData["DEBIT"] === undefined) {
        dynamicData["DEBIT"] = [
          (
            k1 * Math.pow(dynamicData["WATER LEVEL"][0], 2) +
            k2 * dynamicData["WATER LEVEL"][0] +
            k3
          ).toFixed(1),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ];
      }
      await MyModel_allData.create({
        kd_hardware: data.device,
        tlocal: data.tlocal,
        waterlevel: dynamicData["WATER LEVEL"][0],
        debit: dynamicData["DEBIT"][0],
        // debit: debit,
        rainfall: dynamicData["RAINFALL"][0],
        tss: dynamicData["TSS"][0],
        device_temp: dynamicData["DEVICE TEMP."][0],
        battery: dynamicData["BATTERY"][0],
        sedimentasi: (
          (fk * dynamicData["TSS"][0] * dynamicData["DEBIT"][0]) /
          ca
        ).toFixed(3),
      });

      for (const [sensor, values] of Object.entries(dynamicData)) {
        if (values.length > 0) {
          var lowerCase = sensor.toLowerCase().replace(/\s|\.+/g, "");
          await MyModel_rawGPA.create({
            tlocal: data.tlocal,
            kd_hardware: data.device,
            kd_sensor: lowerCase,
            value: values[0],
            value_aktual_or_sample: values[1],
            level0: values[2],
            level1: values[3],
            level2: values[4],
            level3: values[5],
            level4: values[6],
            alarm_status: values[7],
            alarm_setting: values[8],
          });
        }
      }

      return res.send("Data Sent Successfully!");
    } catch (error) {
      return res.send(error);
    }
    // res.send("okeys");
  });
});

// app.post('/rec/send', (req, res) => {
//   console.log('Received body:', req.body);
//   res.send('kentang kentang kentang !.');
// });

// >>> START THE SERVER
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
