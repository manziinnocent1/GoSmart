import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Alert,
  Platform,
  StatusBar,
} from "react-native";

import {
  Search,
  Bell,
  LayoutDashboard,
  Map,
  MessageCircle,
  Users,
  CarFront,
  CreditCard,
  BarChart3,
  ChevronDown,
  Clock3,
  Send,
  Phone,
  RotateCcw,
  MoreHorizontal,
  Paperclip,
  Filter,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";

type TicketStatus = "Urgent" | "Open" | "Solved";

type Message = {
  id: string;
  sender: "customer" | "agent";
  text: string;
  time: string;
};

type Ticket = {
  id: string;
  title: string;
  customer: string;
  initials: string;
  route: string;
  time: string;
  method: string;
  status: TicketStatus;
  preview: string;
  amount?: number;
  messages: Message[];
};

const COLORS = {
  navy: "#10233F",
  navyLight: "#1C3557",
  green: "#05B887",
  greenDark: "#078966",
  greenSoft: "#E6F8F1",
  background: "#F5F7FB",
  white: "#FFFFFF",
  text: "#18263D",
  muted: "#75839A",
  border: "#E6EBF2",
  red: "#F0445B",
  redSoft: "#FFF0F2",
  amber: "#B7791F",
  amberSoft: "#FFF6E5",
  blueSoft: "#EDF4FF",
};

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "TR-8821",
    title: "Overcharged RWF 800",
    customer: "Alice U.",
    initials: "AU",
    route: "Kimironko → Heights",
    time: "Today, 14:10",
    method: "MTN MoMo",
    status: "Urgent",
    preview: "I was charged RWF 2,000 instead of RWF 1,200.",
    amount: 800,
    messages: [
      {
        id: "m1",
        sender: "customer",
        text: "Hello, I was charged RWF 2,000 instead of RWF 1,200. Please check.",
        time: "14:10",
      },
      {
        id: "m2",
        sender: "agent",
        text: "Murakoze Alice! We are reviewing the RWF 800 difference and will help resolve it.",
        time: "14:12",
      },
    ],
  },
  {
    id: "TR-8819",
    title: "Driver never arrived",
    customer: "Patrick K.",
    initials: "PK",
    route: "Remera → Kimihurura",
    time: "Today, 13:45",
    method: "Cash",
    status: "Open",
    preview: "I waited for 15 minutes, but the driver did not arrive.",
    messages: [
      {
        id: "m3",
        sender: "customer",
        text: "I waited for 15 minutes, but the driver never arrived. Can you help?",
        time: "13:45",
      },
    ],
  },
  {
    id: "TR-8815",
    title: "MoMo refund pending",
    customer: "Grace M.",
    initials: "GM",
    route: "Kicukiro → Downtown",
    time: "Today, 12:30",
    method: "MTN MoMo",
    status: "Open",
    preview: "My refund has not arrived in my account.",
    messages: [
      {
        id: "m4",
        sender: "customer",
        text: "My refund has not arrived in my mobile money account. Could you check?",
        time: "12:30",
      },
    ],
  },
  {
    id: "TR-8809",
    title: "Lost helmet",
    customer: "Yves T.",
    initials: "YT",
    route: "Nyarutarama → Remera",
    time: "Today, 11:20",
    method: "Card",
    status: "Solved",
    preview: "I left my helmet behind after the trip.",
    messages: [
      {
        id: "m5",
        sender: "customer",
        text: "I think I left my helmet behind after the trip.",
        time: "11:20",
      },
      {
        id: "m6",
        sender: "agent",
        text: "We located your helmet. Please coordinate collection with our support team.",
        time: "11:32",
      },
    ],
  },
];

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Trips", icon: Map },
  { label: "Support Inbox", icon: MessageCircle },
  { label: "Riders", icon: Users },
  { label: "Drivers", icon: CarFront },
  { label: "Payments", icon: CreditCard },
  { label: "Reports", icon: BarChart3 },
];

function ActionButton({
  title,
  icon: Icon,
  onPress,
  variant = "secondary",
  disabled = false,
}: {
  title: string;
  icon: any;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        variant === "primary" && styles.actionPrimary,
        variant === "danger" && styles.actionDanger,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Icon
        size={16}
        color={
          variant === "primary"
            ? COLORS.white
            : variant === "danger"
              ? COLORS.red
              : COLORS.navy
        }
      />
      <Text
        style={[
          styles.actionText,
          variant === "primary" && { color: COLORS.white },
          variant === "danger" && { color: COLORS.red },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const badgeStyle =
    status === "Urgent"
      ? styles.badgeUrgent
      : status === "Solved"
        ? styles.badgeSolved
        : styles.badgeOpen;

  const textStyle =
    status === "Urgent"
      ? styles.badgeUrgentText
      : status === "Solved"
        ? styles.badgeSolvedText
        : styles.badgeOpenText;

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusText, textStyle]}>{status}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  caption: string;
  icon: any;
  accent: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={[styles.metricIcon, { backgroundColor: accent + "16" }]}>
          <Icon size={19} color={accent} />
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricCaption}>{caption}</Text>
    </View>
  );
}

export default function SupportInboxScreen({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const Container = embedded ? View : SafeAreaView;
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isCompact = width < 720;

  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [selectedId, setSelectedId] = useState("TR-8821");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeNav, setActiveNav] = useState("Support Inbox");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.customer.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.route.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        ticket.status.toLowerCase() === filter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [tickets, search, filter]);

  const openCount = tickets.filter(
    (ticket) => ticket.status !== "Solved",
  ).length;

  const urgentCount = tickets.filter(
    (ticket) => ticket.status === "Urgent",
  ).length;

  function updateTicketStatus(id: string, status: TicketStatus) {
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === id ? { ...ticket, status } : ticket,
      ),
    );
  }

  function sendReply() {
    if (!reply.trim() || !selectedTicket) return;

    const message: Message = {
      id: `reply-${Date.now()}`,
      sender: "agent",
      text: reply.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              messages: [...ticket.messages, message],
            }
          : ticket,
      ),
    );

    setReply("");
  }

  function handleRefund() {
    if (!selectedTicket.amount) return;

    Alert.alert(
      "Confirm refund",
      `Refund RWF ${selectedTicket.amount.toLocaleString()} to ${selectedTicket.customer}? Connect this action to your payment API before processing real transactions.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm demo action",
          onPress: () => {
            setTickets((previous) =>
              previous.map((ticket) =>
                ticket.id === selectedTicket.id
                  ? {
                      ...ticket,
                      status: "Solved",
                      messages: [
                        ...ticket.messages,
                        {
                          id: `refund-${Date.now()}`,
                          sender: "agent",
                          text: `The RWF ${selectedTicket.amount!.toLocaleString()} refund has been marked as processed in this demo. Please verify the actual payment status.`,
                          time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        },
                      ],
                    }
                  : ticket,
              ),
            );
          },
        },
      ],
    );
  }

  function handleCall() {
    Alert.alert(
      "Contact rider",
      `Connect your calling service to contact ${selectedTicket.customer}.`,
    );
  }

  function renderTicket(ticket: Ticket) {
    const active = ticket.id === selectedId;

    return (
      <TouchableOpacity
        key={ticket.id}
        activeOpacity={0.8}
        onPress={() => setSelectedId(ticket.id)}
        style={[styles.ticketCard, active && styles.ticketCardActive]}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketTitleContainer}>
            <Text
              numberOfLines={1}
              style={[styles.ticketTitle, active && styles.ticketTitleActive]}
            >
              {ticket.title}
            </Text>
            <Text style={styles.ticketCustomer}>
              {ticket.customer} · #{ticket.id}
            </Text>
          </View>
          <StatusBadge status={ticket.status} />
        </View>

        <Text
          numberOfLines={2}
          style={[styles.ticketPreview, active && { color: "#D2DDEC" }]}
        >
          {ticket.preview}
        </Text>

        <View style={styles.ticketFooter}>
          <Text style={[styles.ticketMeta, active && { color: "#B7C6D9" }]}>
            {ticket.time}
          </Text>
          <Text style={[styles.ticketMeta, active && { color: "#B7C6D9" }]}>
            {ticket.method}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Container style={[styles.safeArea, embedded && styles.embeddedSafeArea]}>
      {!embedded && (
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      )}

      {/* TOP NAVIGATION */}
      {!embedded && <View style={styles.topbar}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandLetter}>G</Text>
          </View>
          <View>
            <Text style={styles.brandName}>GoSmart</Text>
            <Text style={styles.brandSubtitle}>ADMIN CONSOLE</Text>
          </View>
        </View>

        {!isCompact && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navLinks}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.label;

              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => setActiveNav(item.label)}
                  style={[styles.navItem, active && styles.navItemActive]}
                >
                  <Icon
                    size={17}
                    color={active ? COLORS.greenDark : COLORS.muted}
                  />
                  <Text
                    style={[styles.navLabel, active && styles.navLabelActive]}
                  >
                    {item.label}
                  </Text>
                  {item.label === "Support Inbox" && (
                    <View style={styles.navCount}>
                      <Text style={styles.navCountText}>{openCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.topbarActions}>
          {isCompact && (
            <TouchableOpacity
              onPress={() => setShowMobileMenu(!showMobileMenu)}
              style={styles.iconButton}
            >
              {showMobileMenu ? (
                <X size={21} color={COLORS.navy} />
              ) : (
                <Menu size={21} color={COLORS.navy} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconButton}>
            <Bell size={19} color={COLORS.navy} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          {!isCompact && (
            <View style={styles.adminProfile}>
              <View style={styles.adminAvatar}>
                <Text style={styles.adminAvatarText}>AD</Text>
              </View>
              <View>
                <Text style={styles.adminName}>Administrator</Text>
                <Text style={styles.adminRole}>Support team</Text>
              </View>
              <ChevronDown size={15} color={COLORS.muted} />
            </View>
          )}
        </View>
      </View>}

      {!embedded && isCompact && showMobileMenu && (
        <View style={styles.mobileMenu}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.label;

            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => {
                  setActiveNav(item.label);
                  setShowMobileMenu(false);
                }}
                style={[
                  styles.mobileNavItem,
                  active && styles.mobileNavItemActive,
                ]}
              >
                <Icon
                  size={18}
                  color={active ? COLORS.greenDark : COLORS.muted}
                />
                <Text
                  style={[styles.navLabel, active && styles.navLabelActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PAGE HEADER */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.breadcrumb}>
              <Text style={styles.breadcrumbMuted}>Workspace</Text>
              <Text style={styles.breadcrumbSlash}>/</Text>
              <Text style={styles.breadcrumbCurrent}>Support Inbox</Text>
            </View>

            <Text style={styles.pageTitle}>Support inbox</Text>
            <Text style={styles.pageDescription}>
              Resolve rider issues and keep every journey moving.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => {
              setSearch("");
              setFilter("All");
            }}
          >
            <RotateCcw size={15} color={COLORS.navy} />
            <Text style={styles.outlineButtonText}>Reset filters</Text>
          </TouchableOpacity>
        </View>

        {/* METRICS */}
        <View style={styles.metricsRow}>
          <MetricCard
            label="Open tickets"
            value={String(openCount)}
            caption="Awaiting resolution"
            icon={MessageCircle}
            accent={COLORS.green}
          />
          <MetricCard
            label="Urgent cases"
            value={String(urgentCount)}
            caption="Priority attention"
            icon={AlertCircle}
            accent={COLORS.red}
          />
          <MetricCard
            label="Resolved tickets"
            value={String(
              tickets.filter((ticket) => ticket.status === "Solved").length,
            )}
            caption="Marked as solved"
            icon={CheckCircle2}
            accent="#4384E8"
          />
        </View>

        {/* WORKSPACE */}
        <View style={[styles.workspace, !isWide && styles.workspaceStacked]}>
          {/* LEFT: TICKET QUEUE */}
          <View
            style={[
              styles.queuePanel,
              isWide ? styles.queueWide : styles.queueFull,
            ]}
          >
            <View style={styles.panelHeading}>
              <View>
                <Text style={styles.panelTitle}>All conversations</Text>
                <Text style={styles.panelSubtitle}>
                  {filteredTickets.length} tickets found
                </Text>
              </View>

              <TouchableOpacity
                style={styles.smallIconButton}
                onPress={() => setFilter(filter === "All" ? "Open" : "All")}
              >
                <Filter size={17} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Search size={17} color={COLORS.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search tickets, riders, IDs..."
                placeholderTextColor="#96A2B4"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {!!search && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <X size={16} color={COLORS.muted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {["All", "Urgent", "Open", "Solved"].map((item) => {
                const active = filter === item;

                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setFilter(item)}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.queueDivider} />

            {filteredTickets.length ? (
              filteredTickets.map(renderTicket)
            ) : (
              <View style={styles.emptyState}>
                <Search size={25} color={COLORS.muted} />
                <Text style={styles.emptyTitle}>No tickets found</Text>
                <Text style={styles.emptyDescription}>
                  Try another search or filter.
                </Text>
              </View>
            )}
          </View>

          {/* RIGHT: CONVERSATION */}
          <View
            style={[
              styles.conversationPanel,
              isWide ? styles.conversationWide : styles.queueFull,
            ]}
          >
            <View style={styles.conversationHeader}>
              <View style={styles.conversationTitleGroup}>
                <View style={styles.conversationIcon}>
                  <MessageCircle size={21} color={COLORS.greenDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.conversationTitle}>
                    {selectedTicket.title}
                  </Text>
                  <Text style={styles.conversationId}>
                    #{selectedTicket.id} · {selectedTicket.customer}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.smallIconButton}
                onPress={() => updateTicketStatus(selectedTicket.id, "Solved")}
              >
                <MoreHorizontal size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.conversationMeta}>
              <View style={styles.metaItem}>
                <Map size={14} color={COLORS.muted} />
                <Text style={styles.metaText}>{selectedTicket.route}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock3 size={14} color={COLORS.muted} />
                <Text style={styles.metaText}>{selectedTicket.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <CreditCard size={14} color={COLORS.muted} />
                <Text style={styles.metaText}>{selectedTicket.method}</Text>
              </View>
              <StatusBadge status={selectedTicket.status} />
            </View>

            <View style={styles.conversationDivider} />

            {/* MESSAGE HISTORY */}
            <ScrollView
              style={styles.messageList}
              contentContainerStyle={styles.messageContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.dayDivider}>
                <View style={styles.dayLine} />
                <Text style={styles.dayText}>TODAY</Text>
                <View style={styles.dayLine} />
              </View>

              {selectedTicket.messages.map((message) => {
                const isAgent = message.sender === "agent";

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      isAgent && styles.messageRowAgent,
                    ]}
                  >
                    {!isAgent && (
                      <View style={styles.messageAvatar}>
                        <Text style={styles.messageAvatarText}>
                          {selectedTicket.initials}
                        </Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.messageBubble,
                        isAgent ? styles.agentBubble : styles.customerBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isAgent && styles.agentMessageText,
                        ]}
                      >
                        {message.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isAgent && styles.agentMessageTime,
                        ]}
                      >
                        {message.time}
                        {isAgent ? "  ·  Support" : ""}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* REPLY COMPOSER */}
            <View style={styles.composer}>
              <View style={styles.composerInputRow}>
                <TextInput
                  value={reply}
                  onChangeText={setReply}
                  placeholder="Reply in English / Kinyarwanda..."
                  placeholderTextColor="#96A2B4"
                  multiline
                  style={styles.composerInput}
                  onSubmitEditing={sendReply}
                  blurOnSubmit={false}
                />

                <TouchableOpacity
                  onPress={sendReply}
                  disabled={!reply.trim()}
                  style={[
                    styles.sendButton,
                    !reply.trim() && styles.sendButtonDisabled,
                  ]}
                >
                  <Send size={17} color={COLORS.white} />
                  {!isCompact && (
                    <Text style={styles.sendButtonText}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.composerBottom}>
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={() =>
                    Alert.alert(
                      "Attachments",
                      "Connect your file upload handler here.",
                    )
                  }
                >
                  <Paperclip size={15} color={COLORS.muted} />
                  <Text style={styles.attachText}>Attach file</Text>
                </TouchableOpacity>

                <Text style={styles.composerHint}>Enter to send</Text>
              </View>
            </View>

            {/* SUPPORT ACTIONS */}
            <View style={styles.actionRow}>
              {selectedTicket.amount && selectedTicket.status !== "Solved" ? (
                <ActionButton
                  title={`Refund RWF ${selectedTicket.amount.toLocaleString()}`}
                  icon={RotateCcw}
                  variant="primary"
                  onPress={handleRefund}
                />
              ) : (
                <ActionButton
                  title="Mark as solved"
                  icon={CheckCircle2}
                  variant="primary"
                  onPress={() =>
                    updateTicketStatus(selectedTicket.id, "Solved")
                  }
                  disabled={selectedTicket.status === "Solved"}
                />
              )}

              <ActionButton
                title="Call rider"
                icon={Phone}
                onPress={handleCall}
              />

              {selectedTicket.status !== "Solved" && (
                <ActionButton
                  title="Mark solved"
                  icon={CheckCircle2}
                  onPress={() =>
                    updateTicketStatus(selectedTicket.id, "Solved")
                  }
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            GoSmart · Support Operations
          </Text>
          <Text style={styles.footerText}>
            Helping every journey run smoothly.
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  embeddedSafeArea: {
    paddingTop: 0,
  },

  topbar: {
    minHeight: 76,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 24,
    zIndex: 10,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  brandIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLetter: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "900",
  },

  brandName: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.navy,
    letterSpacing: -0.4,
  },

  brandSubtitle: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.muted,
    letterSpacing: 1.6,
    marginTop: 3,
  },

  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexGrow: 1,
  },

  navItem: {
    minHeight: 43,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  navItemActive: {
    backgroundColor: COLORS.greenSoft,
  },

  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },

  navLabelActive: {
    color: COLORS.greenDark,
    fontWeight: "800",
  },

  navCount: {
    minWidth: 19,
    height: 19,
    borderRadius: 7,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  navCountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },

  topbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.red,
    borderWidth: 1,
    borderColor: COLORS.white,
  },

  adminProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginLeft: 2,
  },

  adminAvatar: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
  },

  adminAvatarText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  adminName: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "800",
  },

  adminRole: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  mobileMenu: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    zIndex: 9,
  },

  mobileNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderRadius: 9,
  },

  mobileNavItemActive: {
    backgroundColor: COLORS.greenSoft,
  },

  page: {
    flex: 1,
  },

  pageContent: {
    paddingHorizontal: 24,
    paddingTop: 27,
    paddingBottom: 30,
    maxWidth: 1800,
    width: "100%",
    alignSelf: "center",
  },

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 24,
  },

  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 9,
  },

  breadcrumbMuted: {
    fontSize: 12,
    color: COLORS.muted,
  },

  breadcrumbSlash: {
    color: "#B6C0CE",
    fontSize: 12,
  },

  breadcrumbCurrent: {
    fontSize: 12,
    color: COLORS.greenDark,
    fontWeight: "700",
  },

  pageTitle: {
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: COLORS.navy,
  },

  pageDescription: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 20,
  },

  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  outlineButtonText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "700",
  },

  metricsRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 24,
  },

  metricCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  metricValue: {
    fontSize: 29,
    fontWeight: "800",
    color: COLORS.navy,
    marginTop: 10,
  },

  metricCaption: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  workspace: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 18,
  },

  workspaceStacked: {
    flexDirection: "column",
  },

  queuePanel: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
  },

  queueWide: {
    width: 300,
    flexShrink: 0,
  },

  queueFull: {
    width: "100%",
  },

  conversationPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 21,
    flex: 1,
    minWidth: 0,
  },

  conversationWide: {
    flex: 1,
  },

  panelHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },

  panelTitle: {
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: "800",
  },

  panelSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
  },

  smallIconButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    height: 43,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F9FAFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 9,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    paddingVertical: 8,
    outlineStyle: "none",
  } as any,

  filterRow: {
    flexDirection: "row",
    gap: 7,
    paddingVertical: 14,
  },

  filterChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  filterChipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },

  filterText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "700",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  queueDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 13,
  },

  ticketCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },

  ticketCardActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },

  ticketHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  ticketTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  ticketTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  ticketTitleActive: {
    color: COLORS.white,
  },

  ticketCustomer: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 6,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    alignSelf: "flex-start",
  },

  badgeUrgent: {
    backgroundColor: COLORS.redSoft,
  },

  badgeOpen: {
    backgroundColor: COLORS.amberSoft,
  },

  badgeSolved: {
    backgroundColor: COLORS.greenSoft,
  },

  badgeUrgentText: {
    color: COLORS.red,
  },

  badgeOpenText: {
    color: COLORS.amber,
  },

  badgeSolvedText: {
    color: COLORS.greenDark,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  ticketPreview: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },

  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 13,
    gap: 6,
  },

  ticketMeta: {
    fontSize: 10,
    color: COLORS.muted,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
  },

  emptyTitle: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 12,
  },

  emptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },

  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  conversationTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  conversationIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  conversationTitle: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "800",
  },

  conversationId: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
  },

  conversationMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 13,
    marginTop: 18,
    marginBottom: 17,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metaText: {
    fontSize: 11,
    color: COLORS.muted,
  },

  conversationDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  messageList: {
    minHeight: 230,
    maxHeight: 420,
    marginTop: 10,
  },

  messageContent: {
    paddingVertical: 16,
    gap: 22,
  },

  dayDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  dayLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dayText: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingRight: "8%",
  },

  messageRowAgent: {
    justifyContent: "flex-end",
    paddingLeft: "8%",
    paddingRight: 0,
  },

  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  messageAvatarText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.navy,
  },

  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    maxWidth: "100%",
    flexShrink: 1,
  },

  customerBubble: {
    backgroundColor: "#F0F3F8",
    borderBottomLeftRadius: 4,
  },

  agentBubble: {
    backgroundColor: COLORS.greenSoft,
    borderBottomRightRadius: 4,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.navy,
  },

  agentMessageText: {
    color: "#165C48",
  },

  messageTime: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 8,
  },

  agentMessageTime: {
    color: COLORS.greenDark,
    textAlign: "right",
  },

  composer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    padding: 8,
    backgroundColor: "#FCFDFE",
  },

  composerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    color: COLORS.text,
    fontSize: 12,
    paddingHorizontal: 9,
    paddingVertical: 9,
  },

  sendButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    minHeight: 39,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },

  composerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingBottom: 4,
  },

  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },

  attachText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  composerHint: {
    color: COLORS.muted,
    fontSize: 10,
  },

  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 17,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#EEF2F8",
  },

  actionPrimary: {
    backgroundColor: COLORS.green,
  },

  actionDanger: {
    backgroundColor: COLORS.redSoft,
  },

  actionText: {
    fontSize: 11,
    color: COLORS.navy,
    fontWeight: "800",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 25,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 10,
  },
});
