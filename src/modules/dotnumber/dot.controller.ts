import axios from 'axios';
import { Request, Response } from 'express';
import { Dot } from '../dotnumber/dotnumber.model';

const API_URL = 'https://www.kodebuilder.com/dotsearch.php?dotNo=';
const API_URL_MC = 'https://www.kodebuilder.com/mcsearch.php?dotNo=';

export const saveDOTData = async (req: Request, res: Response) => {
  const { dot } = req.body;

  if (!dot) {
    return res.status(400).json({ message: 'DOT number is required.' });
  }

  try {
    // Fetch data from both APIs in parallel using Promise.all
    const [dotResponse, mcResponse] = await Promise.all([
      axios.get(`${API_URL}${dot}`),
      axios.get(`${API_URL_MC}${dot}`)
    ]);

    const dotData = dotResponse.data;
    const mcData = mcResponse.data;

    const existingDot = await Dot.findOne({ 'data.dotData.record.content.carrier.dotNumber': parseInt(dot) });

    if (existingDot) {
      return res.status(400).json({ message: 'This DOT and MC data already exists in the database.' });
    }

    const combinedData = {
      dotData,
      mcData
    };

    // Save the combined data into a single object in the database
    const newDot = new Dot({
      data: combinedData,
    });

    await newDot.save();

    res.status(201).json({ message: 'DOT and MC data saved successfully.', dot: newDot });
  } catch (error) {
    console.error('Error fetching or saving DOT/MC data:', error);

    if (axios.isAxiosError(error)) {
      return res.status(500).json({ message: 'Error fetching data from the external APIs.' });
    }

    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getDOTData = async (req: Request, res: Response) => {
  const { dot } = req.params;

  try {
    // Find the data by dotNumber within the nested data structure
    const dotData = await Dot.findOne({ 'data.dotData.record.content.carrier.dotNumber': parseInt(dot) });

    if (!dotData) {
      return res.status(404).json({ message: 'DOT data not found for this number.' });
    }

    res.status(200).json({
      dotData: dotData.data.dotData,
      mcData: dotData.data.mcData,
    });
  } catch (error) {
    console.error('Error fetching DOT and MC data:', error);
    res.status(500).json({ message: 'Error fetching DOT and MC data.', error });
  }
};

export const updateDOTData = async (req: Request, res: Response) => {
  const { dot } = req.body;
  const { id } = req.params;

  if (!id || !dot) {
    return res.status(400).json({ message: 'Object ID and DOT number are required.' });
  }

  try {

    const response = await axios.get(`${API_URL}${dot}`);


    const existingDot = await Dot.findById(id);

    if (!existingDot) {
      return res.status(404).json({ message: 'DOT entry not found.' });
    }

    existingDot.data = response.data;

    await existingDot.save();

    res.status(200).json({ message: 'DOT data updated successfully.', dot: existingDot });
  } catch (error) {
    console.error('Error updating DOT data:', error);

    if (axios.isAxiosError(error)) {
      return res.status(500).json({ message: 'Error fetching data from the external API.' });
    }

    res.status(500).json({ message: 'Internal server error.' });
  }
};


