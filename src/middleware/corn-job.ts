import cron from 'node-cron';
import Company from '../modules/companyProfile/companyprofile-model';
import { sendEmail } from '../middleware/nodeMailermiddleware';
import Trailer from '../modules/trailerList/trailer-model';
import Truck from '../modules/truckList/truck.models';
import Driver from '../modules/driverList/driver-model';


// Schedule to run at 4 PM daily
cron.schedule('59 16 * * *', async () => { 
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); 

    try {
        // Fetching company document expiration alerts
        const expiringCompanies = await Company.find({
            $or: [
                { kyuExpiration: { $gte: today, $lt: tomorrow } },
                { nyExpiration: { $gte: today, $lt: tomorrow } },
                { irpRenewalDate: { $gte: today, $lt: tomorrow } },
                { trailerRegistration: { $gte: today, $lt: tomorrow } },
            ],
        });

        // Fetching truck expiration alerts
        const expiringTrucks = await Truck.find({
            expirationDate: { $gte: today, $lt: tomorrow },
        });

        // Fetching trailer expiration alerts
        const expiringTrailers = await Trailer.find({
            expirationDate: { $gte: today, $lt: tomorrow },
        });

        // Fetching driver expiration alerts
        const expiringDrivers = await Driver.find({
            $or: [
                { licenseExpirationDate: { $gte: today, $lt: tomorrow } },
                { medicalExpirationDate: { $gte: today, $lt: tomorrow } },
                { workAuthorizationExpirationDate: { $gte: today, $lt: tomorrow } },
            ],
        });

        // Sending email alerts for company documents
        for (const doc of expiringCompanies) {
            const message = `Dear ${doc.companyName},\n\nYour document is expiring soon. Please take action immediately.\n\nThank you.`;
            await sendEmail(doc.ownerEmail, 'Document Expiration Alert', message);
        }

        // Sending email alerts for trucks
        for (const truck of expiringTrucks) {
            const company = await Company.findOne({ _id: truck.companyId });
            if (company) {
                const message = `Dear ${company.companyName},\n\nThe expiration date for your truck (Unit Number: ${truck.unitNumber}) is approaching. Please renew it promptly.\n\nThank you.`;
                await sendEmail(company.ownerEmail, 'Truck Expiration Alert', message);
            }
        }

        // Sending email alerts for trailers
        for (const trailer of expiringTrailers) {
            const company = await Company.findOne({ _id: trailer.companyId });
            if (company) {
                const message = `Dear ${company.companyName},\n\nThe expiration date for your trailer (Unit Number: ${trailer.unitNumber}) is approaching. Please renew it promptly.\n\nThank you.`;
                await sendEmail(company.ownerEmail, 'Trailer Expiration Alert', message);
            }
        }

        // Sending email alerts for drivers
        for (const driver of expiringDrivers) {
            const company = await Company.findOne({ _id: driver.companyId });
            if (company) {
                const message = `Dear ${company.companyName},\n\nThe following document(s) for your driver (Name: ${driver.driverName}) are expiring soon:\n${
                    driver.licenseExpirationDate && driver.licenseExpirationDate >= today && driver.licenseExpirationDate < tomorrow 
                        ? '- License Expiration\n' 
                        : ''
                }${
                    driver.medicalExpirationDate && driver.medicalExpirationDate >= today && driver.medicalExpirationDate < tomorrow 
                        ? '- Medical Certificate Expiration\n' 
                        : ''
                }${
                    driver.workAuthorizationExpirationDate && driver.workAuthorizationExpirationDate >= today && driver.workAuthorizationExpirationDate < tomorrow 
                        ? '- Work Authorization Expiration\n' 
                        : ''
                }\nPlease take action immediately.\n\nThank you.`;
                await sendEmail(company.ownerEmail, 'Driver Expiration Alert', message);
            }
        }

        console.log('Alerts sent successfully.');
    } catch (error) {
        console.error('Error sending alerts:', error);
    }  
});
