import React, { useState, useEffect } from "react";
import {
  custcare,
  recommendation,
  seat,
  schoolBus,
  filledticket,
  orangeBus,
  routes,
  smile,
} from "../../assets/homepage";
import { Navbar, InfoCard, Title, BusRoute } from "../../components";
import Loader from "../Loader/Loader"; // Import the loader component
import BottomBar from "../BottomBar/BottomBar.jsx"; // Import the BottomBar component
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./landingPage.scss";

const LandingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Loader state
  let currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  currentDate = `${year}-${month}-${day}`;

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const [locationOneSuggestions, setLocationOneSuggestions] = useState([]);
  const [locationTwoSuggestions, setLocationTwoSuggestions] = useState([]);

  const handleSearchClick = (fromLocation, toLocation, selectedDate) => {
    if (fromLocation && toLocation && selectedDate) {
      if (
        fromLocation.trim().toLowerCase() === toLocation.trim().toLowerCase()
      ) {
        alert("Source and destination cities cannot be the same.");
        return;
      }

      navigate(
        `/busbooking?from=${fromLocation}&to=${toLocation}&date=${selectedDate}`
      );
    } else {
      alert("Please enter values for all fields");
    }
  };

  const fetchLocationSuggestions = async (query, setLocationSuggestions) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/busBooking/searchCity/${query}`
      );
      setLocationSuggestions(response.data.data);
    } catch (error) {
      console.error("Something went wrong:", error);
    }
  };

  useEffect(() => {
    let debounceTimer;

    const handleQueryChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (fromLocation) {
          fetchLocationSuggestions(fromLocation, setLocationOneSuggestions);
        }
        if (toLocation) {
          fetchLocationSuggestions(toLocation, setLocationTwoSuggestions);
        }
      }, 500);
    };

    handleQueryChange();

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [fromLocation, toLocation]);

  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // Simulate a delay for loading (e.g., fetching data)
    setTimeout(() => {
      setLoading(false);
    }, 2000); // Change this value to how long it takes to load your content
  }, []);

  if (loading) {
    return <Loader />; // Show loader while the page is loading
  }

  return (
    <div className="landingPage">
      <Navbar page={"home"} />
      <BusRoute
        locationOne={fromLocation}
        locationTwo={toLocation}
        departureDate={formatDateToYYYYMMDD(new Date())}
        returnDate=""
        onSearch={handleSearchClick}
      />
      <div className="popularBusTicket">
        <h1 style={{ fontSize: 24, paddingTop: 20 }}>Popular Bus Ticket</h1>
        <div className="wrapper">
          <InfoCard
            img={schoolBus}
            title={"Convenient Booking"}
            subtitle={"Free Taxi On The Bus"}
          />
          <InfoCard
            img={seat}
            title={"Comfortable Seats"}
            subtitle={
              "You can spend 12 hours without any discomfort in our seats"
            }
          />
          <InfoCard
            img={recommendation}
            title={"Buy Tickets Easily"}
            subtitle={"UPI, Bank Payments, Visa, MasterCards, etc..."}
          />
        </div>
      </div>

      <div className="whyChooseYesGoBus">
        <Title title={"Why YesGoBus For Bus Booking"} />
        <div className="whyChooseYesGoBusContainer">
          <InfoCard img={routes} title={"10000+"} subtitle={"Routes"} />
          <InfoCard img={orangeBus} title={"3500+"} subtitle={"BUS PARTNERS"} />
          <InfoCard
            img={filledticket}
            title={"30 SEC"}
            subtitle={"INSTANT E-TICKET & REFUND"}
          />
          <InfoCard
            img={smile}
            title={"1 million"}
            subtitle={"HAPPY CUSTOMERS"}
          />
          <InfoCard
            img={custcare}
            title={"24/7"}
            subtitle={"CUSTOMER SUPPORT"}
          />
        </div>
      </div>

      <BottomBar /> {/* Add the BottomBar component */}
    </div>
  );
};

export default LandingPage;
