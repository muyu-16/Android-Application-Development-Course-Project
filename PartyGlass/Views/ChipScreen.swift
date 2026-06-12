import SwiftUI
import Combine

// MARK: - Chip Store
class ChipStore: ObservableObject {
    @Published var players: [Player] = []
    @Published var undoStack: [ChipRecord] = []

    struct Player: Identifiable, Codable {
        var id: UUID
        var name: String
        var chips: Int
        init(name: String, chips: Int) {
            self.id = UUID()
            self.name = name
            self.chips = chips
        }
    }

    struct ChipRecord: Identifiable {
        let id = UUID()
        let playerId: UUID
        let delta: Int
    }

    func addPlayer(name: String, chips: Int = 1000) {
        withAnimation { players.append(Player(name: name, chips: chips)) }
    }

    func removePlayer(_ player: Player) {
        withAnimation { players.removeAll { $0.id == player.id } }
    }

    func adjustChips(for playerId: UUID, delta: Int) {
        guard let idx = players.firstIndex(where: { $0.id == playerId }) else { return }
        let newValue = players[idx].chips + delta
        guard newValue >= 0 else { return }
        players[idx].chips = newValue
        undoStack.append(ChipRecord(playerId: playerId, delta: delta))
    }

    func undo() {
        guard let last = undoStack.popLast() else { return }
        guard let idx = players.firstIndex(where: { $0.id == last.playerId }) else { return }
        players[idx].chips -= last.delta
    }

    var sortedByChips: [Player] {
        players.sorted { $0.chips > $1.chips }
    }
}

// MARK: - Chip Screen
struct ChipScreen: View {
    let namespace: Namespace.ID
    @EnvironmentObject var store: ChipStore
    @State private var showAddPlayer = false

    var body: some View {
        VStack(spacing: DesignToken.stackSpacing) {
            // Header
            HStack {
                Text("Chips")
                    .font(.largeTitle.bold())
                    .foregroundStyle(DesignToken.textPrimary)
                Spacer()
                Button("Settle") { showSettlement() }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(DesignToken.accent)
                    .glassEffectIfAvailable(.regular.tint(.yellow.opacity(0.1)).interactive(),
                                            shape: .capsule)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
            }
            .padding(.top, 60)
            .padding(.horizontal, DesignToken.margin)

            // Undo
            if !store.undoStack.isEmpty {
                Button {
                    withAnimation { store.undo() }
                    let generator = UIImpactFeedbackGenerator(style: .light)
                    generator.impactOccurred()
                } label: {
                    Label("Undo", systemImage: "arrow.uturn.backward")
                        .font(.footnote)
                        .foregroundStyle(DesignToken.textTertiary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, DesignToken.margin)
            }

            // Players
            ScrollView {
                VStack(spacing: 10) {
                    ForEach(store.players) { player in
                        GlassCard(tint: .yellow.opacity(0.06)) {
                            HStack(spacing: 16) {
                                // Avatar
                                Text(String(player.name.prefix(1)).uppercased())
                                    .font(.title2.weight(.bold))
                                    .foregroundStyle(DesignToken.textPrimary)
                                    .frame(width: 44, height: 44)
                                    .background(Circle().fill(.ultraThinMaterial))

                                // Info
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(player.name)
                                        .font(.headline)
                                        .foregroundStyle(DesignToken.textPrimary)
                                    NumberTile(value: "\(player.chips)", size: 20,
                                              color: DesignToken.chipGold)
                                    + Text(" chips")
                                        .font(.caption)
                                        .foregroundStyle(DesignToken.textTertiary)
                                }

                                Spacer()

                                // Controls
                                HStack(spacing: 8) {
                                    chipButton(-100, player: player, color: .red)
                                    chipButton(+100, player: player, color: .green)
                                }
                            }
                        }
                        .padding(.horizontal, DesignToken.margin)
                    }
                }
                .padding(.bottom, 100)
            }

            // Add Player Button
            GlassButton(title: "Add Player",
                       icon: "person.badge.plus",
                       action: { showAddPlayer = true },
                       tint: .yellow)
                .padding(.horizontal, DesignToken.margin)
                .padding(.bottom, 80)
        }
        .alert("Add Player", isPresented: $showAddPlayer) {
            TextField("Name", text: .constant(""))
            TextField("Starting chips", value: .constant(1000), format: .number)
            Button("Cancel", role: .cancel) {}
            Button("Add") {
                store.addPlayer(name: "New Player")
            }
        }
    }

    private func chipButton(_ delta: Int, player: ChipStore.Player, color: Color) -> some View {
        Button {
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            withAnimation(DesignToken.springBouncy) {
                store.adjustChips(for: player.id, delta: delta)
            }
        } label: {
            Text(delta > 0 ? "+" : "")
                .font(.title3.weight(.bold))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
        }
        .glassButtonStyle(tint: color)
    }

    private func showSettlement() {
        let sorted = store.sortedByChips
        let medals = ["🥇", "🥈", "🥉"]
        var msg = ""
        for (i, p) in sorted.enumerated() {
            msg += "\(medals[safe: i] ?? "\(i + 1).") \(p.name): \(p.chips) chips\n"
        }
        msg += "\nTotal: \(sorted.reduce(0) { $0 + $1.chips }) chips"

        let alert = UIAlertController(title: "🏆 Final Ranking", message: msg,
                                       preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let root = windowScene.windows.first?.rootViewController {
            root.present(alert, animated: true)
        }
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
