import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Vibration, View } from "react-native";
import { formatRwf } from "../../utils/format";
import DriverAccountScreen from "./DriverAccountScreen";
import DriverDashboardScreen from "./DriverDashboardScreen";
import DriverEarningsScreen from "./DriverEarningsScreen";
import DriverNavigationScreen from "./DriverNavigationScreen";
import DriverTabBar from "./DriverTabBar";
import type { DriverTab } from "./DriverTabBar";
import IncomingRequestScreen from "./IncomingRequestScreen";
import TripCompleteScreen from "./TripCompleteScreen";
import {
  DRIVER,
  INITIAL_HISTORY,
  MIN_CASHOUT,
  REQUEST_SECONDS,
  clockNow,
  commissionOf,
  makeRequest,
  netOf,
} from "./driverData";
import type { HistoryItem, RideRequest } from "./driverData";

interface Props {
  onLogout: () => void;
  /**
   * Demo: a fake ride request arrives a few seconds after the driver goes
   * online. Set to false once real requests come from your backend.
   */
  demoRequests?: boolean;
}

type Stage = "idle" | "request" | "trip" | "summary";

const DEMO_DELAY_MS = 7000;

export default function DriverHomeScreen({
  onLogout,
  demoRequests = true,
}: Props) {
  const [tab, setTab] = useState<DriverTab>("home");
  const [stage, setStage] = useState<Stage>("idle");
  const [request, setRequest] = useState<RideRequest | null>(null);

  const [online, setOnline] = useState(false);
  const [acceptCash, setAcceptCash] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Numbers for today (replace with your backend data)
  const [earningsToday, setEarningsToday] = useState(24500);
  const [tripsToday, setTripsToday] = useState(14);
  const [wallet, setWallet] = useState(18300);
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [onlineMinutes, setOnlineMinutes] = useState(315);
  const [offers, setOffers] = useState(50);
  const [accepted, setAccepted] = useState(46);

  const counter = useRef(0);

  // Count the time spent online
  useEffect(() => {
    if (!online) return;
    const id = setInterval(() => setOnlineMinutes((m) => m + 1), 60000);
    return () => clearInterval(id);
  }, [online]);

  // Clear the top message after a few seconds
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  // Demo: send a ride request a few seconds after going online
  useEffect(() => {
    if (!demoRequests || !online || stage !== "idle") return;
    const id = setTimeout(() => {
      const next = makeRequest(counter.current, acceptCash);
      counter.current += 1;
      setRequest(next);
      setStage("request");
      Vibration.vibrate(400);
    }, DEMO_DELAY_MS);
    return () => clearTimeout(id);
  }, [demoRequests, online, stage, acceptCash]);

  const backToIdle = () => {
    setRequest(null);
    setStage("idle");
  };

  /* ----- Request handlers ----- */

  const acceptRequest = () => {
    setOffers((n) => n + 1);
    setAccepted((n) => n + 1);
    // TODO: tell your backend that this driver accepted the request.
    setStage("trip");
  };

  const declineRequest = () => {
    setOffers((n) => n + 1);
    backToIdle();
  };

  const missRequest = () => {
    setOffers((n) => n + 1);
    setNotice("You missed a request. Stay online to receive more.");
    backToIdle();
  };

  /* ----- Trip handlers ----- */

  const cancelTrip = () => {
    // TODO: tell your backend that the driver cancelled.
    setNotice("Trip cancelled.");
    backToIdle();
  };

  const completeTrip = () => {
    if (!request) return;
    const commission = commissionOf(request.fareRwf);
    const net = netOf(request.fareRwf);
    setEarningsToday((e) => e + net);
    setTripsToday((n) => n + 1);
    // MoMo fares land in the wallet. For cash, the commission is taken from it.
    setWallet((w) =>
      request.payment === "momo" ? w + net : Math.max(0, w - commission),
    );
    setHistory((h) => [
      {
        id: `trip-${request.id}`,
        kind: "trip",
        when: clockNow(),
        title: `${request.pickupArea} → ${request.dropoff}`,
        tier: request.tier,
        fare: request.fareRwf,
        commission,
        payment: request.payment,
      },
      ...h,
    ]);
    setStage("summary");
  };

  /* ----- Wallet ----- */

  const cashOut = () => {
    if (wallet < MIN_CASHOUT) {
      Alert.alert(
        "Not enough balance",
        `The minimum cash out is ${formatRwf(MIN_CASHOUT)}.`,
      );
      return;
    }
    Alert.alert(
      "Cash out to MoMo?",
      `${formatRwf(wallet)} will be sent to ${DRIVER.payoutNumber}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Cash out",
          onPress: () => {
            // TODO: ask your backend to send the money with MoMo.
            const amount = wallet;
            setWallet(0);
            setHistory((h) => [
              { id: `cashout-${Date.now()}`, kind: "cashout", when: clockNow(), amount },
              ...h,
            ]);
            Alert.alert(
              "Cash out requested",
              `${formatRwf(amount)} is on its way to ${DRIVER.payoutNumber}.`,
            );
          },
        },
      ],
    );
  };

  /* ----- Full-screen steps ----- */

  if (stage === "request" && request) {
    return (
      <IncomingRequestScreen
        key={request.id}
        request={request}
        seconds={REQUEST_SECONDS}
        onAccept={acceptRequest}
        onDecline={declineRequest}
        onExpire={missRequest}
      />
    );
  }

  if (stage === "trip" && request) {
    return (
      <DriverNavigationScreen
        key={request.id}
        request={request}
        onComplete={completeTrip}
        onCancel={cancelTrip}
      />
    );
  }

  if (stage === "summary" && request) {
    return (
      <TripCompleteScreen
        key={request.id}
        request={request}
        onDone={(rating) => {
          // TODO: send the passenger rating to your backend.
          if (rating) setNotice(`Thanks. You rated ${request.passenger.name} ${rating}/5.`);
          backToIdle();
        }}
      />
    );
  }

  /* ----- Tabs ----- */

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {tab === "home" && (
          <DriverDashboardScreen
            driver={DRIVER}
            online={online}
            onToggleOnline={setOnline}
            earningsToday={earningsToday}
            tripsToday={tripsToday}
            acceptance={Math.round((accepted / offers) * 100)}
            onlineMinutes={onlineMinutes}
            notice={notice}
            onWallet={() => setTab("earnings")}
          />
        )}
        {tab === "earnings" && (
          <DriverEarningsScreen
            wallet={wallet}
            earningsToday={earningsToday}
            tripsToday={tripsToday}
            history={history}
            payoutNumber={DRIVER.payoutNumber}
            onCashOut={cashOut}
          />
        )}
        {tab === "account" && (
          <DriverAccountScreen
            driver={DRIVER}
            acceptCash={acceptCash}
            onAcceptCash={setAcceptCash}
            onLogout={onLogout}
          />
        )}
      </View>
      <DriverTabBar active={tab} onChange={setTab} online={online} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
